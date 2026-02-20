export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

/**
 * GET: Standorte der Organisation des eingeloggten Nutzers (für Kunden-Menü / Location-Switcher).
 * Liefert nur aktive Locations.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json(
        { error: 'Session ungültig' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json([])
    }

    const locations = await prisma.location.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Fehler beim Abrufen der Standorte:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
