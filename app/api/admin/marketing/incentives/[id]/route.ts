import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  couponId: z.string().optional().nullable(),
  personaliseCoupon: z.boolean().optional(),
  walletAmount: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxGrantsPerUser: z.number().int().positive().optional(),
  displayChannel: z.enum(['EMAIL', 'IN_APP', 'BOTH']).optional(),
  isActive: z.boolean().optional(),
})

// GET: Einzelnen Incentive
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params
    const incentive = await prisma.segmentIncentive.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        segment: { select: { id: true, name: true } },
        coupon: { select: { id: true, code: true, name: true, type: true } },
        _count: { select: { grants: true } },
      },
    })

    if (!incentive) {
      return NextResponse.json({ error: 'Incentive nicht gefunden.' }, { status: 404 })
    }

    return NextResponse.json(incentive)
  } catch (error) {
    console.error('Fehler beim Abrufen des Incentives:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// PATCH: Incentive bearbeiten
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.segmentIncentive.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Incentive nicht gefunden.' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.couponId !== undefined) updateData.couponId = validated.couponId || null
    if (validated.personaliseCoupon !== undefined) updateData.personaliseCoupon = validated.personaliseCoupon
    if (validated.walletAmount !== undefined) {
      updateData.walletAmount = validated.walletAmount != null ? validated.walletAmount : null
    }
    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate ? new Date(validated.startDate) : new Date()
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null
    }
    if (validated.maxGrantsPerUser !== undefined) updateData.maxGrantsPerUser = validated.maxGrantsPerUser
    if (validated.displayChannel !== undefined) updateData.displayChannel = validated.displayChannel
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const incentive = await prisma.segmentIncentive.update({
      where: { id },
      data: updateData,
      include: {
        segment: { select: { id: true, name: true } },
        coupon: { select: { id: true, code: true, name: true, type: true } },
        _count: { select: { grants: true } },
      },
    })

    return NextResponse.json(incentive)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.errors }, { status: 400 })
    }
    console.error('Fehler beim Aktualisieren des Incentives:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE: Incentive löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.segmentIncentive.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Incentive nicht gefunden.' }, { status: 404 })
    }

    await prisma.segmentIncentive.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Incentives:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
