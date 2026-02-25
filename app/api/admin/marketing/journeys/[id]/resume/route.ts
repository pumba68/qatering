export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const journey = await prisma.journey.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, status: true },
    })
    if (!journey) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }
    if (journey.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Nur pausierte Journeys können fortgesetzt werden' },
        { status: 400 }
      )
    }

    const updated = await prisma.journey.update({
      where: { id: params.id },
      data: { status: 'ACTIVE' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/admin/marketing/journeys/[id]/resume error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
