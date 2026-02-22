export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 10

const VALID_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED',
] as const

/**
 * GET /api/admin/kunden/[id]/bestellungen
 *
 * Paginierte Bestellhistorie eines Kunden inkl. Aggregat-Kennzahlen.
 *
 * Query-Parameter:
 *  - page       (default: 1)
 *  - status     (PENDING | CONFIRMED | PREPARING | READY | PICKED_UP | CANCELLED)
 *  - dateFrom   (ISO date string)
 *  - dateTo     (ISO date string)
 *  - search     (Bestellnummer / pickupCode)
 *  - locationId (UUID)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error

    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    // Mandantentrennung: Sicherstellen, dass Kunde zur selben Org gehört
    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const skip = (page - 1) * PAGE_SIZE

    const statusParam = searchParams.get('status') ?? ''
    const dateFrom = searchParams.get('dateFrom') ?? ''
    const dateTo = searchParams.get('dateTo') ?? ''
    const search = searchParams.get('search') ?? ''
    const locationId = searchParams.get('locationId') ?? ''

    // Basis-Where: immer nach userId filtern
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId }

    if (statusParam && VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])) {
      where.status = statusParam
    }

    if (dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) }
    }
    if (dateTo) {
      // dateTo inklusiv: bis Ende des Tages
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: to }
    }

    if (search.trim()) {
      where.pickupCode = { contains: search.trim(), mode: 'insensitive' }
    }

    if (locationId) {
      where.locationId = locationId
    }

    // Aggregat-Kennzahlen (über ALLE Bestellungen dieses Kunden, ohne Filter)
    const [aggregates, orders, total] = await Promise.all([
      prisma.order.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _max: { createdAt: true },
      }),
      prisma.order.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          pickupCode: true,
          status: true,
          channel: true,
          totalAmount: true,
          finalAmount: true,
          discountAmount: true,
          employerSubsidyAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
          pickupDate: true,
          pickedUpAt: true,
          location: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              productNameSnapshot: true,
              productCategorySnapshot: true,
              unitPriceSnapshot: true,
              menuItem: {
                select: {
                  dish: { select: { name: true, category: true } },
                  price: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    // Bestellungen serialisieren
    const data = orders.map((o) => ({
      id: o.id,
      pickupCode: o.pickupCode,
      status: o.status,
      channel: o.channel,
      totalAmount: Number(o.totalAmount),
      finalAmount: o.finalAmount ? Number(o.finalAmount) : null,
      discountAmount: o.discountAmount ? Number(o.discountAmount) : null,
      employerSubsidyAmount: o.employerSubsidyAmount ? Number(o.employerSubsidyAmount) : null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      notes: o.notes,
      createdAt: o.createdAt,
      pickupDate: o.pickupDate,
      pickedUpAt: o.pickedUpAt,
      location: o.location,
      items: o.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        // Snapshot mit Fallback auf Dish-Daten für ältere Bestellungen
        productName: item.productNameSnapshot ?? item.menuItem?.dish?.name ?? '[Produkt gelöscht]',
        productCategory: item.productCategorySnapshot ?? item.menuItem?.dish?.category ?? null,
        unitPrice: item.unitPriceSnapshot
          ? Number(item.unitPriceSnapshot)
          : item.menuItem?.price
          ? Number(item.menuItem.price)
          : Number(item.price),
      })),
    }))

    return NextResponse.json({
      data,
      kpis: {
        totalOrders: aggregates._count.id,
        totalRevenue: aggregates._sum.totalAmount ? Number(aggregates._sum.totalAmount) : 0,
        avgOrderValue: aggregates._avg.totalAmount ? Number(aggregates._avg.totalAmount) : 0,
        lastOrderAt: aggregates._max.createdAt ?? null,
      },
      pagination: {
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellhistorie:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
