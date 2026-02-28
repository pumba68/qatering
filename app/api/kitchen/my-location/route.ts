export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

/** GET /api/kitchen/my-location – gibt alle Standort-Zuweisungen des eingeloggten Nutzers zurück */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const userId = (session.user as any).id

  const assignments = await prisma.userLocation.findMany({
    where: { userId },
    select: {
      role: true,
      location: {
        select: { id: true, name: true, address: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(assignments)
}
