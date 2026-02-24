export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCustomerContext } from '@/lib/profil-helpers'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 10

const ORDER_SELECT = {
  id: true,
  pickupCode: true,
  status: true,
  channel: true,
  totalAmount: true,
  finalAmount: true,
  discountAmount: true,
  pickupDate: true,
  pickupTimeSlot: true,
  createdAt: true,
  notes: true,
  location: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      productNameSnapshot: true,
      menuItem: {
        select: {
          dish: { select: { name: true } },
        },
      },
    },
  },
} as const

function serializeOrder(o: {
  id: string
  pickupCode: string
  status: string
  channel: string | null
  totalAmount: { toNumber: () => number } | number
  finalAmount: { toNumber: () => number } | number | null
  discountAmount: { toNumber: () => number } | number | null
  pickupDate: Date
  pickupTimeSlot: string | null
  createdAt: Date
  notes: string | null
  location: { id: string; name: string } | null
  items: {
    id: string
    quantity: number
    price: { toNumber: () => number } | number
    productNameSnapshot: string | null
    menuItem: { dish: { name: string } | null } | null
  }[]
}) {
  return {
    id: o.id,
    pickupCode: o.pickupCode,
    status: o.status,
    channel: o.channel,
    totalAmount: Number(o.totalAmount),
    finalAmount: o.finalAmount != null ? Number(o.finalAmount) : null,
    discountAmount: o.discountAmount != null ? Number(o.discountAmount) : null,
    pickupDate: o.pickupDate,
    pickupTimeSlot: o.pickupTimeSlot,
    createdAt: o.createdAt,
    notes: o.notes,
    location: o.location,
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      productName:
        item.productNameSnapshot ??
        item.menuItem?.dish?.name ??
        '[Produkt gelöscht]',
    })),
  }
}

/**
 * GET /api/profil/bestellungen
 *
 * Returns the authenticated customer's upcoming and past orders.
 *
 * Query params:
 *  - page      (default: 1) — pagination for historical orders
 */
export async function GET(req: NextRequest) {
  try {
    const { error, userId } = await getCustomerContext()
    if (error) return error
    if (!userId) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const skip = (page - 1) * PAGE_SIZE

    const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] as const
    const DONE_STATUSES = ['PICKED_UP', 'CANCELLED'] as const

    const [upcoming, history, historyTotal] = await Promise.all([
      prisma.order.findMany({
        where: { userId, status: { in: [...ACTIVE_STATUSES] } },
        orderBy: { pickupDate: 'asc' },
        select: ORDER_SELECT,
      }),
      prisma.order.findMany({
        where: { userId, status: { in: [...DONE_STATUSES] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: ORDER_SELECT,
      }),
      prisma.order.count({
        where: { userId, status: { in: [...DONE_STATUSES] } },
      }),
    ])

    return NextResponse.json({
      upcoming: upcoming.map(serializeOrder),
      history: history.map(serializeOrder),
      pagination: {
        total: historyTotal,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(historyTotal / PAGE_SIZE),
      },
    })
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestellhistorie:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
