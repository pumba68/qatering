export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/locations
 * Öffentlicher Endpunkt – kein Auth erforderlich.
 * Gibt alle aktiven Standorte zurück (mandantenübergreifend).
 * PROJ-25: Customer Entry Flow
 */
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(locations, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der öffentlichen Standorte:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
