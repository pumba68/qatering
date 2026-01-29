import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

const SORT_FIELDS = ['createdAt', 'pickupDate', 'totalAmount', 'status', 'pickupCode'] as const
const SORT_ORDERS = ['asc', 'desc'] as const
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'] as const

/** GET: Bestellungen für Admin (Filter, Sortierung) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/orders/route.ts:GET',message:'GET admin orders entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const locationId = searchParams.get('locationId') || undefined
    const status = searchParams.get('status') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const sortByParam = searchParams.get('sortBy') || 'createdAt'
    const sortOrderParam = searchParams.get('sortOrder') || 'desc'

    const sortBy = SORT_FIELDS.includes(sortByParam as (typeof SORT_FIELDS)[number])
      ? (sortByParam as (typeof SORT_FIELDS)[number])
      : 'createdAt'
    const sortOrder = SORT_ORDERS.includes(sortOrderParam as (typeof SORT_ORDERS)[number])
      ? (sortOrderParam as (typeof SORT_ORDERS)[number])
      : 'desc'

    const statusValid =
      status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
        ? (status as (typeof ORDER_STATUSES)[number])
        : undefined

    const where: {
      userId?: string
      locationId?: string
      status?: (typeof ORDER_STATUSES)[number]
      pickupDate?: { gte?: Date; lte?: Date }
    } = {}
    if (userId) where.userId = userId
    if (locationId) where.locationId = locationId
    if (statusValid) where.status = statusValid
    if (dateFrom || dateTo) {
      const range: { gte?: Date; lte?: Date } = {}
      if (dateFrom) {
        const d = new Date(dateFrom)
        d.setHours(0, 0, 0, 0)
        range.gte = d
      }
      if (dateTo) {
        const d = new Date(dateTo)
        d.setHours(23, 59, 59, 999)
        range.lte = d
      }
      if (range.gte != null || range.lte != null) where.pickupDate = range
    }

    const orderBy = { [sortBy]: sortOrder } as { createdAt?: 'asc' | 'desc'; pickupDate?: 'asc' | 'desc'; totalAmount?: 'asc' | 'desc'; status?: 'asc' | 'desc'; pickupCode?: 'asc' | 'desc' }

    const orders = await prisma.order.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                dish: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/orders/route.ts:GET',message:'GET admin orders success',data:{count:orders.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(orders)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/orders/route.ts:GET',message:'GET admin orders error',data:{err:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    console.error('Fehler beim Abrufen der Bestellungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
