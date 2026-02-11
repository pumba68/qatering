import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  segmentId: z.string().optional(),
  triggerType: z.enum(['SCHEDULED', 'EVENT']).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  actionType: z.enum(['SEND_EMAIL', 'SHOW_IN_APP', 'GRANT_INCENTIVE']).optional(),
  actionConfig: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

/** GET: Einzelner Workflow */
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
    const workflow = await prisma.marketingWorkflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        segment: { select: { id: true, name: true } },
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Fehler beim Abrufen des Workflows:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** PATCH: Workflow aktualisieren (inkl. isActive-Toggle) */
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
    const existing = await prisma.marketingWorkflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateWorkflowSchema.parse(body)

    if (validated.segmentId) {
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
    }

    const updateData: Prisma.MarketingWorkflowUpdateInput = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.segmentId !== undefined) updateData.segmentId = validated.segmentId
    if (validated.triggerType !== undefined) updateData.triggerType = validated.triggerType
    if (validated.triggerConfig !== undefined) updateData.triggerConfig = validated.triggerConfig as Prisma.InputJsonValue
    if (validated.actionType !== undefined) updateData.actionType = validated.actionType
    if (validated.actionConfig !== undefined) updateData.actionConfig = validated.actionConfig as Prisma.InputJsonValue
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const workflow = await prisma.marketingWorkflow.update({
      where: { id },
      data: updateData,
      include: { segment: { select: { id: true, name: true } } },
    })

    return NextResponse.json(workflow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Workflows:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** DELETE: Workflow löschen (inkl. Logs durch Cascade) */
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
    const existing = await prisma.marketingWorkflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.marketingWorkflow.delete({ where: { id } })
    return NextResponse.json({ message: 'Workflow gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Workflows:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
