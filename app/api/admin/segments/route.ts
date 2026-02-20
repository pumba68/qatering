export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import {
  loadAudienceData,
  computeSegmentAudience,
  type SegmentRule,
  type RulesCombination,
} from '@/lib/segment-audience'

const segmentSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  description: z.string().max(2000).optional().nullable(),
  rulesCombination: z.enum(['AND', 'OR']).optional().default('AND'),
  rules: z
    .array(
      z.object({
        attribute: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in']),
        value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
      })
    )
    .optional()
    .default([]),
})

/** GET: Alle Segmente der Organisation */
export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    if (typeof (prisma as { customerSegment?: unknown }).customerSegment === 'undefined') {
      console.error('Prisma Client enthält customerSegment nicht. Bitte "npx prisma generate" ausführen (Dev-Server vorher beenden).')
      return NextResponse.json(
        { error: 'Marketing-Modul nicht geladen. Bitte Dev-Server beenden, im Projektordner "npx prisma generate" ausführen und Server neu starten.' },
        { status: 500 }
      )
    }

    const segments = await prisma.customerSegment.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { inAppMessages: true, workflows: true },
        },
      },
    })

    return NextResponse.json(segments)
  } catch (error) {
    console.error('Fehler beim Abrufen der Segmente:', error)
    const message = error instanceof Error ? error.message : ''
    const hint = message.includes('customerSegment') || message.includes('findMany')
      ? ' Bitte Dev-Server beenden, "npx prisma generate" ausführen und neu starten.'
      : ''
    return NextResponse.json(
      { error: `Interner Serverfehler.${hint}` },
      { status: 500 }
    )
  }
}

/** POST: Neues Segment anlegen */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = segmentSchema.parse(body)

    const existing = await prisma.customerSegment.findUnique({
      where: {
        organizationId_name: {
          organizationId: ctx.organizationId,
          name: validated.name.trim(),
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Ein Segment mit dem Namen "${validated.name}" existiert bereits.` },
        { status: 409 }
      )
    }

    const segment = await prisma.customerSegment.create({
      data: {
        organizationId: ctx.organizationId,
        name: validated.name.trim(),
        description: validated.description?.trim() ?? null,
        rulesCombination: (validated.rulesCombination as RulesCombination) ?? 'AND',
        rules: (validated.rules as SegmentRule[]) ?? [],
      },
    })

    return NextResponse.json(segment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Anlegen des Segments:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
