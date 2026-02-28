export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/pos/menu?locationId=X&date=YYYY-MM-DD
 * Holt alle verfügbaren MenuItem für den Standort am gewählten Tag.
 * Erfordert Auth (CASHIER | ADMIN | SUPER_ADMIN).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('locationId')
  const dateParam = searchParams.get('date') // YYYY-MM-DD

  if (!locationId) {
    return NextResponse.json({ error: 'locationId fehlt.' }, { status: 400 })
  }

  // Datum: heute falls kein Parameter
  const targetDate = dateParam ? new Date(dateParam) : new Date()
  // Start/End des gesuchten Tags (UTC midnight)
  const dayStart = new Date(targetDate)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDate)
  dayEnd.setUTCHours(23, 59, 59, 999)

  const items = await prisma.menuItem.findMany({
    where: {
      available: true,
      menu: { locationId },
      date: { gte: dayStart, lte: dayEnd },
    },
    select: {
      id: true,
      price: true,
      isPromotion: true,
      promotionPrice: true,
      promotionLabel: true,
      maxOrders: true,
      currentOrders: true,
      dish: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          category: true,
        },
      },
    },
    orderBy: [{ dish: { category: 'asc' } }, { dish: { name: 'asc' } }],
  })

  // Effektiven Preis berechnen
  const result = items.map((item) => {
    const basePrice = Number(item.price)
    const effectivePrice =
      item.isPromotion && item.promotionPrice != null
        ? Number(item.promotionPrice)
        : basePrice
    const soldOut = item.maxOrders != null && item.currentOrders >= item.maxOrders

    return {
      id: item.id,
      dish: item.dish,
      price: effectivePrice,
      originalPrice: basePrice,
      isPromotion: item.isPromotion,
      promotionLabel: item.promotionLabel,
      soldOut,
    }
  })

  return NextResponse.json(result)
}
