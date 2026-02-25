export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  triggerType: z.enum(['EVENT', 'SEGMENT_ENTRY', 'DATE_BASED']).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  content: z.record(z.unknown()).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  reEntryPolicy: z.string().max(20).optional(),
  conversionGoal: z.record(z.unknown()).optional().nullable(),
  exitRules: z.array(z.record(z.unknown())).optional().nullable(),
})

export async function GET(
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
    })

    if (!journey) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(journey)
  } catch (error) {
    console.error('GET /api/admin/marketing/journeys/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const existing = await prisma.journey.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { content, triggerConfig, conversionGoal, exitRules, startDate, endDate, ...rest } = parsed.data

    const updated = await prisma.journey.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(content !== undefined && { content: content as never }),
        ...(triggerConfig !== undefined && { triggerConfig: triggerConfig as never }),
        ...(conversionGoal !== undefined && { conversionGoal: conversionGoal as never ?? null }),
        ...(exitRules !== undefined && { exitRules: exitRules as never ?? null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/admin/marketing/journeys/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const existing = await prisma.journey.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Nur Entwürfe können gelöscht werden' },
        { status: 400 }
      )
    }

    await prisma.journey.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/marketing/journeys/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
