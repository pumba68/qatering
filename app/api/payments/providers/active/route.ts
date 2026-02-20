export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getActiveProviders } from '@/lib/payment-config'

/** GET /api/payments/providers/active — cached list of active payment providers for the user's org */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ providers: [] })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ providers: [] })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ providers: [] })
  }

  const providers = await getActiveProviders(user.organizationId)
  return NextResponse.json({ providers })
}
