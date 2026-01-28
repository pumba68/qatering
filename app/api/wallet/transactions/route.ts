import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

const TYPES = ['TOP_UP', 'ORDER_PAYMENT', 'REFUND', 'ADJUSTMENT'] as const
const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const type: (typeof TYPES)[number] | undefined =
      typeParam && TYPES.includes(typeParam as (typeof TYPES)[number]) ? (typeParam as (typeof TYPES)[number]) : undefined

    const where: { userId: string; type?: (typeof TYPES)[number]; createdAt?: { gte?: Date; lte?: Date } } = { userId }
    if (type) where.type = type
    if (dateFrom || dateTo) {
      const dateFilter: { gte?: Date; lte?: Date } = {}
      if (dateFrom) {
        const d = new Date(dateFrom)
        d.setHours(0, 0, 0, 0)
        dateFilter.gte = d
      }
      if (dateTo) {
        const d = new Date(dateTo)
        d.setHours(23, 59, 59, 999)
        dateFilter.lte = d
      }
      if (dateFilter.gte != null || dateFilter.lte != null) where.createdAt = dateFilter
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          description: true,
          orderId: true,
          createdAt: true,
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
  } catch (error) {
    console.error('Fehler beim Abrufen der Transaktionen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
