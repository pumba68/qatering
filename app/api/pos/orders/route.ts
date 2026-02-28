export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { generatePickupCode } from '@/lib/utils'
import { ensureWallet, chargeWithinTx } from '@/lib/wallet'

function toNum(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'object' && v !== null && 'toNumber' in v) return (v as any).toNumber()
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function effectivePrice(item: { price: unknown; isPromotion: boolean; promotionPrice: unknown }): number {
  if (item.isPromotion && item.promotionPrice != null) {
    const p = toNum(item.promotionPrice)
    if (p >= 0) return p
  }
  return toNum(item.price)
}

/**
 * POST /api/pos/orders
 * Legt eine POS-Bestellung an (channel: KASSE, status: PICKED_UP).
 * Body: { locationId, items: [{menuItemId, quantity}], paymentMethod: 'cash'|'sumup'|'wallet',
 *         customerId?, cashGiven? }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const cashierId = (session.user as any).id as string
  const body = await request.json()
  const { locationId, items, paymentMethod, customerId, cashGiven } = body

  if (!locationId || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
    return NextResponse.json({ error: 'Ungültige Bestelldaten.' }, { status: 400 })
  }

  if (!['cash', 'sumup', 'wallet'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Ungültige Zahlungsmethode.' }, { status: 400 })
  }

  // Wallet-Zahlung nur mit zugeordnetem Kunden
  if (paymentMethod === 'wallet' && !customerId) {
    return NextResponse.json(
      { error: 'Wallet-Zahlung erfordert einen zugeordneten Kunden.' },
      { status: 400 }
    )
  }

  // MenuItems validieren + Preise berechnen
  let totalAmount = 0
  const validatedItems: Array<{ menuItemId: string; quantity: number; price: number; dishName: string }> = []

  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
      include: { dish: { select: { name: true } } },
    })

    if (!menuItem || !menuItem.available) {
      return NextResponse.json(
        { error: `Artikel nicht verfügbar: ${menuItem?.dish.name ?? item.menuItemId}` },
        { status: 400 }
      )
    }
    if (menuItem.maxOrders != null && menuItem.currentOrders >= menuItem.maxOrders) {
      return NextResponse.json(
        { error: `Ausverkauft: ${menuItem.dish.name}` },
        { status: 400 }
      )
    }

    const unitPrice = effectivePrice(menuItem)
    totalAmount += unitPrice * item.quantity
    validatedItems.push({
      menuItemId: menuItem.id,
      quantity: item.quantity,
      price: unitPrice,
      dishName: menuItem.dish.name,
    })
  }

  totalAmount = Math.round(totalAmount * 100) / 100

  // Wallet-Guthaben prüfen
  if (paymentMethod === 'wallet') {
    const wallet = await ensureWallet(customerId)
    const balance = toNum(wallet.balance)
    if (balance < totalAmount) {
      return NextResponse.json(
        {
          error: `Wallet-Guthaben unzureichend. Verfügbar: ${balance.toFixed(2)} €, benötigt: ${totalAmount.toFixed(2)} €`,
          balance,
        },
        { status: 400 }
      )
    }
  }

  const targetUserId = customerId ?? cashierId
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const pickupCode = generatePickupCode()

  const notesLines: string[] = ['[POS-Verkauf]']
  if (!customerId) notesLines.push('Gast-Kauf (kein Kundenkonto)')

  // Transaktion: Bestellung erstellen + optional Wallet buchen
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: targetUserId,
        locationId,
        status: 'PICKED_UP',
        paymentStatus: 'COMPLETED',
        paymentMethod: paymentMethod === 'cash' ? 'BAR' : paymentMethod === 'sumup' ? 'SUMUP' : 'WALLET',
        totalAmount,
        pickupCode,
        pickupDate: today,
        channel: 'KASSE',
        notes: notesLines.join('\n'),
        items: {
          create: validatedItems.map((vi) => ({
            menuItemId: vi.menuItemId,
            quantity: vi.quantity,
            price: vi.price,
          })),
        },
      },
      include: {
        items: {
          include: { menuItem: { include: { dish: true } } },
        },
        user: { select: { name: true, email: true } },
        location: { select: { name: true } },
      },
    })

    // Bestellzähler erhöhen
    for (const vi of validatedItems) {
      await tx.menuItem.update({
        where: { id: vi.menuItemId },
        data: { currentOrders: { increment: vi.quantity } },
      })
    }

    // Wallet belasten
    if (paymentMethod === 'wallet') {
      await chargeWithinTx(tx, customerId!, totalAmount, {
        orderId: newOrder.id,
        description: `POS-Kauf #${pickupCode}`,
      })
    }

    return newOrder
  })

  const change = paymentMethod === 'cash' && cashGiven != null ? cashGiven - totalAmount : null

  return NextResponse.json({
    orderId: order.id,
    pickupCode: order.pickupCode,
    totalAmount,
    paymentMethod,
    change: change != null ? Math.round(change * 100) / 100 : null,
    items: order.items.map((i) => ({
      name: i.menuItem.dish.name,
      quantity: i.quantity,
      price: toNum(i.price),
    })),
    customer: customerId ? { name: order.user.name, email: order.user.email } : null,
    location: order.location.name,
    createdAt: order.createdAt,
  })
}
