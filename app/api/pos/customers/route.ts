export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/pos/customers?q=searchterm
 * Sucht Kunden (name/email) innerhalb der Organisation des eingeloggten Nutzers.
 * Erfordert Auth (CASHIER | ADMIN | SUPER_ADMIN).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const organizationId = (session.user as any).organizationId as string | undefined

  const users = await prisma.user.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      role: 'CUSTOMER',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      wallet: { select: { balance: true } },
    },
    take: 8,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      walletBalance: u.wallet ? Number(u.wallet.balance) : 0,
    }))
  )
}
