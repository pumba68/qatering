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

    const source = await prisma.journey.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!source) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }

    const copy = await prisma.journey.create({
      data: {
        organizationId: ctx.organizationId,
        name: `${source.name} (Kopie)`,
        description: source.description,
        triggerType: source.triggerType,
        triggerConfig: source.triggerConfig as never,
        content: source.content as never,
        status: 'DRAFT',
        reEntryPolicy: source.reEntryPolicy,
        conversionGoal: source.conversionGoal as never ?? undefined,
        exitRules: source.exitRules as never ?? undefined,
      },
    })

    return NextResponse.json(copy, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/marketing/journeys/[id]/duplicate error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
