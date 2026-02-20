export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import type { SegmentRule, RulesCombination } from '@/lib/segment-audience'

const updateSegmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  rulesCombination: z.enum(['AND', 'OR']).optional(),
  rules: z
    .array(
      z.object({
        attribute: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in']),
        value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
      })
    )
    .optional(),
})

/** GET: Einzelnes Segment */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const segment = await prisma.customerSegment.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        _count: {
          select: { inAppMessages: true, workflows: true },
        },
      },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(segment)
  } catch (error) {
    console.error('Fehler beim Abrufen des Segments:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** PATCH: Segment aktualisieren */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await prisma.customerSegment.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateSegmentSchema.parse(body)

    if (validated.name !== undefined && validated.name.trim() !== existing.name) {
      const duplicate = await prisma.customerSegment.findUnique({
        where: {
          organizationId_name: {
            organizationId: ctx.organizationId,
            name: validated.name.trim(),
          },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: `Ein Segment mit dem Namen "${validated.name}" existiert bereits.` },
          { status: 409 }
        )
      }
    }

    const updateData: {
      name?: string
      description?: string | null
      rulesCombination?: string
      rules?: SegmentRule[]
    } = {}
    if (validated.name !== undefined) updateData.name = validated.name.trim()
    if (validated.description !== undefined) updateData.description = validated.description?.trim() ?? null
    if (validated.rulesCombination !== undefined) updateData.rulesCombination = validated.rulesCombination
    if (validated.rules !== undefined) updateData.rules = validated.rules as SegmentRule[]

    const segment = await prisma.customerSegment.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { inAppMessages: true, workflows: true },
        },
      },
    })

    return NextResponse.json(segment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Segments:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** DELETE: Segment löschen. Prüft ob Workflows/InAppMessages referenzieren. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await prisma.customerSegment.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        _count: { select: { inAppMessages: true, workflows: true } },
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    const inUse = (existing._count?.inAppMessages ?? 0) + (existing._count?.workflows ?? 0) > 0
    if (inUse) {
      return NextResponse.json(
        {
          error: 'Segment wird noch verwendet',
          inAppMessages: existing._count?.inAppMessages ?? 0,
          workflows: existing._count?.workflows ?? 0,
        },
        { status: 409 }
      )
    }

    await prisma.customerSegment.delete({ where: { id } })
    return NextResponse.json({ message: 'Segment gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Segments:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
