import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const workflowSchema = z.object({
  segmentId: z.string().min(1, 'Segment ist erforderlich'),
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  triggerType: z.enum(['SCHEDULED', 'EVENT']),
  triggerConfig: z.record(z.unknown()).optional().default({}),
  actionType: z.enum(['SEND_EMAIL', 'SHOW_IN_APP', 'GRANT_INCENTIVE']),
  actionConfig: z.record(z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true),
})

/** GET: Alle Workflows der Organisation */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get('segmentId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: { organizationId: string; segmentId?: string; isActive?: boolean } = {
      organizationId: ctx.organizationId,
    }
    if (segmentId) where.segmentId = segmentId
    if (!includeInactive) where.isActive = true

    const workflows = await prisma.marketingWorkflow.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        segment: { select: { id: true, name: true } },
        executionLogs: {
          orderBy: { executedAt: 'desc' },
          take: 1,
          select: { id: true, executedAt: true, status: true, message: true },
        },
      },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Fehler beim Abrufen der Workflows:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** POST: Neuen Workflow anlegen */
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
    const validated = workflowSchema.parse(body)

    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: validated.segmentId,
        organizationId: ctx.organizationId,
      },
    })
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    const workflow = await prisma.marketingWorkflow.create({
      data: {
        organizationId: ctx.organizationId,
        segmentId: validated.segmentId,
        name: validated.name,
        triggerType: validated.triggerType,
        triggerConfig: (validated.triggerConfig ?? {}) as Prisma.InputJsonValue,
        actionType: validated.actionType,
        actionConfig: (validated.actionConfig ?? {}) as Prisma.InputJsonValue,
        isActive: validated.isActive ?? true,
      },
      include: {
        segment: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Anlegen des Workflows:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
