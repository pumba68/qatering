export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@/src/generated/prisma'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { generatePickupCode } from '@/lib/utils'
import { ensureWallet, chargeWithinTx } from '@/lib/wallet'
import { enrollUserInJourneys, checkAndConvertParticipants } from '@/lib/journey-enroll'

/** Wandelt Preis (Prisma Decimal, string, number) in number um. */
function toPriceNumber(value: unknown): number {
  if (value == null) return NaN
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return parseFloat(value)
  // Prisma Decimal (decimal.js) hat .toNumber()
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

/** Preis pro Einheit für Abrechnung: Aktion = promotionPrice, sonst Normalpreis. */
function getEffectiveMenuItemPrice(menuItem: { price: unknown; isPromotion?: boolean; promotionPrice?: unknown }): number {
  if (menuItem.isPromotion) {
    const p = toPriceNumber(menuItem.promotionPrice)
    if (!Number.isNaN(p) && p >= 0) return p
  }
  const base = toPriceNumber(menuItem.price)
  return Number.isNaN(base) ? 0 : base
}

// POST: Neue Bestellung erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { locationId, items, pickupDate, notes, couponCode } = body
    const userId = (session.user as any).id

    if (!locationId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Ungültige Bestelldaten' },
        { status: 400 }
      )
    }

    // MenuItems validieren und Preise berechnen
    let totalAmount = 0
    const menuItems: Array<{ menuItem: any, quantity: number }> = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { dish: true },
      })

      if (!menuItem || !menuItem.available) {
        return NextResponse.json(
          { error: `Gericht "${menuItem?.dish.name || 'Unbekannt'}" nicht verfügbar` },
          { status: 400 }
        )
      }

      // Prüfen ob maxOrders erreicht
      if (menuItem.maxOrders && menuItem.currentOrders >= menuItem.maxOrders) {
        return NextResponse.json(
          { error: `Gericht "${menuItem.dish.name}" ist ausverkauft` },
          { status: 400 }
        )
      }

      totalAmount += getEffectiveMenuItemPrice(menuItem) * item.quantity
      menuItems.push({ menuItem, quantity: item.quantity })
    }

    // Coupon validieren und anwenden (falls vorhanden)
    let coupon = null
    let discountAmount = 0
    let finalAmount = totalAmount
    let freeItemToAdd: { menuItemId: string; quantity: number } | null = null

    if (couponCode) {
      const couponResult = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
        include: { freeItemDish: true },
      })

      if (couponResult && couponResult.isActive) {
        // Validiere Coupon erneut
        const now = new Date()
        const isValidLocation = !couponResult.locationId || couponResult.locationId === locationId
        const isValidTime = (!couponResult.startDate || new Date(couponResult.startDate) <= now) &&
                           (!couponResult.endDate || new Date(couponResult.endDate) >= now)
        const isValidMinOrder = !couponResult.minOrderAmount || totalAmount >= Number(couponResult.minOrderAmount)
        const isValidMaxUses = !couponResult.maxUses || couponResult.currentUses < couponResult.maxUses
        const isValidUserUses = !couponResult.maxUsesPerUser || 
          (await prisma.couponRedemption.count({
            where: { couponId: couponResult.id, userId },
          })) < couponResult.maxUsesPerUser

        if (isValidLocation && isValidTime && isValidMinOrder && isValidMaxUses && isValidUserUses) {
          coupon = couponResult

          // Berechne Rabatt
          if (coupon.type === 'DISCOUNT_PERCENTAGE') {
            discountAmount = (totalAmount * Number(coupon.discountValue)) / 100
            finalAmount = totalAmount - discountAmount
          } else if (coupon.type === 'DISCOUNT_FIXED') {
            discountAmount = Number(coupon.discountValue)
            finalAmount = Math.max(0, totalAmount - discountAmount)
          } else if (coupon.type === 'FREE_ITEM' && coupon.freeItemDish) {
            // Suche nach MenuItem für das kostenlose Gericht
            // Für jetzt nehmen wir an, dass es für denselben Tag wie die Bestellung ist
            const pickupDateObj = new Date(pickupDate)
            const dayStart = new Date(pickupDateObj)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(pickupDateObj)
            dayEnd.setHours(23, 59, 59, 999)

            const menu = await prisma.menu.findFirst({
              where: {
                locationId,
                startDate: { lte: pickupDateObj },
                endDate: { gte: pickupDateObj },
                isPublished: true,
              },
              include: {
                menuItems: {
                  where: {
                    dishId: coupon.freeItemDish.id,
                    date: {
                      gte: dayStart,
                      lt: dayEnd,
                    },
                    available: true,
                  },
                  take: 1,
                },
              },
            })

            if (menu && menu.menuItems.length > 0) {
              const freeMi = menu.menuItems[0]
              freeItemToAdd = {
                menuItemId: freeMi.id,
                quantity: 1,
              }
              // Für kostenlose Artikel wird kein Rabatt abgezogen, sondern das Item kostenlos hinzugefügt
              discountAmount = getEffectiveMenuItemPrice(freeMi)
              finalAmount = totalAmount // Endbetrag bleibt gleich, da Extra kostenlos ist
            }
          }
        }
      }
    }

    // Arbeitgeber-Zuschuss (Company) anwenden
    let employerSubsidyAmount = 0
    let employerCompanyId: string | null = null

    // Arbeitgeber-Beziehung laden (falls vorhanden)
    const companyEmployeeWhere: Prisma.CompanyEmployeeWhereInput = {
      userId,
      isActive: true,
      OR: [
        { validFrom: null, validUntil: null },
        {
          AND: [
            { validFrom: { lte: new Date() } },
            { OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] },
          ],
        },
      ],
    }
    const companyEmployee = await prisma.companyEmployee.findFirst({
      where: companyEmployeeWhere,
      include: {
        company: true,
      },
    })

    if (companyEmployee?.company && companyEmployee.company.isActive) {
      const company = companyEmployee.company
      employerCompanyId = company.id

      // Basis für Zuschuss: Betrag nach Coupon
      const baseAmount = finalAmount

      if (company.subsidyType === 'PERCENTAGE' && company.subsidyValue) {
        employerSubsidyAmount = (baseAmount * Number(company.subsidyValue)) / 100
      } else if (company.subsidyType === 'FIXED' && company.subsidyValue) {
        employerSubsidyAmount = Number(company.subsidyValue)
      }

      // Optional: Maximaler Zuschuss pro Tag
      if (company.subsidyMaxPerDay && employerSubsidyAmount > Number(company.subsidyMaxPerDay)) {
        employerSubsidyAmount = Number(company.subsidyMaxPerDay)
      }

      // Endbetrag nach Zuschuss
      finalAmount = Math.max(0, baseAmount - employerSubsidyAmount)
    }

    const chargeAmount = Math.round(finalAmount * 100) / 100

    // Wallet-Prüfung: Guthaben muss ausreichen (außer Bestellung ist 0 €)
    if (chargeAmount > 0) {
      const wallet = await ensureWallet(userId)
      const balance = Number(wallet.balance)
      if (balance < chargeAmount) {
        return NextResponse.json(
          {
            error: `Guthaben nicht ausreichend. Verfügbar: ${balance.toFixed(2)} €, Benötigt: ${chargeAmount.toFixed(2)} €`,
          },
          { status: 400 }
        )
      }
    }

    // QR-Code generieren (eindeutig)
    let pickupCode: string = ''
    let codeExists = true
    while (codeExists) {
      pickupCode = generatePickupCode()
      const existingOrder = await prisma.order.findUnique({
        where: { pickupCode },
      })
      codeExists = !!existingOrder
    }

    // Bestellung erstellen (Transaction)
    const order = await prisma.$transaction(async (tx) => {
      // Füge kostenloses Item hinzu, falls vorhanden
      const allMenuItems = [...menuItems]
      if (freeItemToAdd) {
        const freeMenuItem = await tx.menuItem.findUnique({
          where: { id: freeItemToAdd.menuItemId },
          include: { dish: true },
        })
        if (freeMenuItem) {
          allMenuItems.push({ menuItem: freeMenuItem, quantity: freeItemToAdd.quantity })
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          locationId,
          totalAmount,
          finalAmount: finalAmount !== totalAmount ? finalAmount : null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          couponCode: coupon?.code || null,
          employerSubsidyAmount: employerSubsidyAmount > 0 ? employerSubsidyAmount : null,
          employerCompanyId: employerCompanyId,
          pickupCode: pickupCode,
          pickupDate: new Date(pickupDate),
          notes,
          status: 'PENDING',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'WALLET',
          items: {
            create: allMenuItems.map(({ menuItem, quantity }) => ({
              menuItemId: menuItem.id,
              quantity,
              price: freeItemToAdd && menuItem.id === freeItemToAdd.menuItemId ? 0 : getEffectiveMenuItemPrice(menuItem), // Kostenloses Item = 0, sonst Sonderpreis oder Normalpreis
            })),
          },
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  dish: true,
                },
              },
            },
          },
        },
      })

      // Coupon-Redemption erstellen (falls Coupon verwendet wurde)
      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId,
            orderId: newOrder.id,
          },
        })

        // PROJ-4e: IncentiveGrant als eingelöst markieren
        await tx.incentiveGrant.updateMany({
          where: { couponId: coupon.id, userId },
          data: { redeemedAt: new Date(), redeemedOrderId: newOrder.id },
        })

        // currentUses im Coupon erhöhen
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            currentUses: {
              increment: 1,
            },
          },
        })
      }

      // currentOrders in MenuItems aktualisieren
      for (const { menuItem, quantity } of allMenuItems) {
        await tx.menuItem.update({
          where: { id: menuItem.id },
          data: {
            currentOrders: {
              increment: quantity,
            },
          },
        })
      }

      // Wallet belasten (atomar in derselben Transaktion)
      let newBalance: number | null = null
      if (chargeAmount > 0) {
        const { balanceAfter } = await chargeWithinTx(tx, userId, chargeAmount, {
          orderId: newOrder.id,
          description: `Bestellung #${pickupCode}`,
        })
        newBalance = balanceAfter
      }

      return { order: newOrder, newBalance }
    })

    const result = order as { order: unknown; newBalance: number | null }
    const out = result.order as Record<string, unknown>
    if (result.newBalance != null) out.walletBalanceAfter = result.newBalance

    // PROJ-24: Journey-Enrollment (fire-and-forget)
    // Prüfen ob dies die erste Bestellung des Nutzers ist
    void (async () => {
      try {
        const userRecord = await prisma.user.findUnique({
          where: { id: userId },
          select: { organizationId: true },
        })
        const orgId = userRecord?.organizationId
        if (!orgId) return

        const orderCount = await prisma.order.count({ where: { userId } })
        if (orderCount === 1) {
          // Erste Bestellung → order.first Journeys einschreiben
          await enrollUserInJourneys(userId, 'order.first', orgId)
        }
        // Conversion-Goal prüfen (z.B. order.first als Ziel in einer anderen Journey)
        await checkAndConvertParticipants(userId, 'order.first', orgId)
      } catch (e) {
        console.error('Journey enrollment after order failed:', e)
      }
    })()

    return NextResponse.json(out, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Guthaben nicht ausreichend')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Fehler beim Erstellen der Bestellung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// GET: Bestellungen abrufen (mit Filtern)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const pickupDate = searchParams.get('pickupDate')

    const where: any = {}
    if (userId) where.userId = userId
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    if (pickupDate) {
      const date = new Date(pickupDate)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.pickupDate = {
        gte: date,
        lt: nextDay,
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                dish: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
