export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

const TYPE_LABEL: Record<string, string> = {
  TOP_UP: 'Aufladung',
  ORDER_PAYMENT: 'Bestellung',
  REFUND: 'Erstattung',
  ADJUSTMENT: 'Anpassung',
}

/**
 * GET /api/admin/zahlungen
 * All wallet transactions for this organization.
 * Filters: type, provider, dateFrom, dateTo, search (name/email), page
 * Export: ?export=csv
 */
export async function GET(request: NextRequest) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const type     = searchParams.get('type') || undefined
  const provider = searchParams.get('provider') || undefined
  const search   = searchParams.get('search') || undefined
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo   = searchParams.get('dateTo') || undefined
  const exportCsv = searchParams.get('export') === 'csv'

  // Build where clause
  const where: Record<string, unknown> = {}

  // Only show transactions for users of this org
  const userFilter: Record<string, unknown> = {}
  if (organizationId) userFilter.organizationId = organizationId
  if (search) userFilter.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ]
  where.user = userFilter

  if (type) where.type = type

  // provider filter: 'admin' means no paymentProvider set (manual top-ups)
  if (provider === 'admin') {
    where.paymentProvider = null
  } else if (provider) {
    where.paymentProvider = provider
  }

  if (dateFrom || dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); dateFilter.gte = d }
    if (dateTo)   { const d = new Date(dateTo);   d.setHours(23, 59, 59, 999); dateFilter.lte = d }
    where.createdAt = dateFilter
  }

  const select = {
    id: true,
    createdAt: true,
    type: true,
    amount: true,
    balanceBefore: true,
    balanceAfter: true,
    paymentProvider: true,
    externalPaymentId: true,
    description: true,
    user: { select: { id: true, name: true, email: true } },
    order: { select: { id: true } },
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  if (exportCsv) {
    const rows = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
      select,
    })
    const lines = [
      'Datum,Nutzer,E-Mail,Typ,Betrag,Zahlmethode,Beschreibung,Externe ID',
      ...rows.map((r) => {
        const method = r.paymentProvider
          ? r.paymentProvider.charAt(0).toUpperCase() + r.paymentProvider.slice(1)
          : r.type === 'TOP_UP' ? 'Admin-Aufladung' : 'Guthaben'
        return [
          new Date(r.createdAt).toISOString(),
          r.user?.name ?? '',
          r.user?.email ?? '',
          TYPE_LABEL[r.type] ?? r.type,
          Number(r.amount).toFixed(2),
          method,
          r.description ?? '',
          r.externalPaymentId ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      }),
    ]
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="zahlungen-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // ── Paginated list ────────────────────────────────────────────────────────
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select,
    }),
    prisma.walletTransaction.count({ where }),
  ])

  // ── Summary stats ─────────────────────────────────────────────────────────
  const [topUpTotal, orderTotal, refundTotal] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { ...where, type: 'TOP_UP' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.walletTransaction.aggregate({
      where: { ...where, type: 'ORDER_PAYMENT' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.walletTransaction.aggregate({
      where: { ...where, type: 'REFUND' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats: {
      topUpSum: Number(topUpTotal._sum.amount ?? 0),
      topUpCount: topUpTotal._count,
      orderSum: Math.abs(Number(orderTotal._sum.amount ?? 0)),
      orderCount: orderTotal._count,
      refundSum: Number(refundTotal._sum.amount ?? 0),
      refundCount: refundTotal._count,
    },
  })
}
