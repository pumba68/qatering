export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

/** GET /api/admin/settings/payments/transactions — payment transaction overview */
export async function GET(request: NextRequest) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const provider = searchParams.get('provider') || undefined
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo = searchParams.get('dateTo') || undefined
  const exportCsv = searchParams.get('export') === 'csv'

  // Build where clause: only TOP_UP transactions (wallet loads via payment providers)
  const where: Record<string, unknown> = {
    type: 'TOP_UP',
    ...(provider ? { paymentProvider: provider } : {}),
  }

  // Filter by organization: only users of this org
  if (organizationId) {
    where.user = { organizationId }
  }

  if (dateFrom || dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); dateFilter.gte = d }
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.lte = d }
    where.createdAt = dateFilter
  }

  if (exportCsv) {
    const rows = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        createdAt: true,
        amount: true,
        paymentProvider: true,
        externalPaymentId: true,
        type: true,
        user: { select: { name: true, email: true } },
      },
    })
    const lines = [
      'Datum,Nutzer,E-Mail,Betrag,Methode,Typ,Externe ID',
      ...rows.map((r) =>
        [
          new Date(r.createdAt).toISOString(),
          r.user?.name ?? '',
          r.user?.email ?? '',
          Number(r.amount).toFixed(2),
          r.paymentProvider ?? '',
          r.type,
          r.externalPaymentId ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ]
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transaktionen-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        type: true,
        paymentProvider: true,
        externalPaymentId: true,
        description: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.walletTransaction.count({ where }),
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
  })
}
