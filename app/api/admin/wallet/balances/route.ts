import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const filter = searchParams.get('filter') // '' | 'low' | 'zero' | 'negative'
    const sort = searchParams.get('sort') || 'balanceDesc' // balanceDesc | balanceAsc | nameAsc

    const where: { OR?: Array<{ email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }> } = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { walletTransactions: true },
        },
      },
      orderBy: { email: 'asc' },
    })

    let list = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      balance: u.wallet ? Number(u.wallet.balance) : 0,
      walletUpdatedAt: u.wallet?.updatedAt,
      transactionCount: u._count.walletTransactions,
    }))

    if (filter === 'low') list = list.filter((u) => u.balance > 0 && u.balance < 5)
    else if (filter === 'zero') list = list.filter((u) => u.balance === 0)
    else if (filter === 'negative') list = list.filter((u) => u.balance < 0)

    if (sort === 'balanceDesc') list.sort((a, b) => b.balance - a.balance)
    else if (sort === 'balanceAsc') list.sort((a, b) => a.balance - b.balance)
    else if (sort === 'nameAsc') list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))

    const totalBalance = list.reduce((s, u) => s + u.balance, 0)
    const zeroCount = list.filter((u) => u.balance === 0).length
    const avgBalance = list.length ? totalBalance / list.length : 0

    return NextResponse.json({
      users: list,
      stats: {
        totalBalance,
        zeroCount,
        avgBalance,
        userCount: list.length,
      },
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Guthaben:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
