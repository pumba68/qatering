export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@/src/generated/prisma/runtime/library'
import { z } from 'zod'

const createSchema = z.object({
  segmentId: z.string().min(1),
  name: z.string().max(200).optional().nullable(),
  incentiveType: z.enum(['COUPON', 'WALLET_CREDIT']),
  couponId: z.string().optional().nullable(),
  personaliseCoupon: z.boolean().optional().default(false),
  walletAmount: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxGrantsPerUser: z.number().int().positive().optional().default(1),
  displayChannel: z.enum(['EMAIL', 'IN_APP', 'BOTH']).optional().default('BOTH'),
  isActive: z.boolean().optional().default(true),
})

// GET: Alle Incentives der Organisation
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const incentives = await prisma.segmentIncentive.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        segment: { select: { id: true, name: true } },
        coupon: { select: { id: true, code: true, name: true, type: true } },
        _count: { select: { grants: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(incentives)
  } catch (error) {
    console.error('Fehler beim Abrufen der Incentives:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST: Neuen Incentive anlegen
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    if (validated.incentiveType === 'COUPON') {
      if (!validated.couponId) {
        return NextResponse.json(
          { error: 'Bei Coupon-Incentive muss ein Coupon ausgewählt werden.' },
          { status: 400 }
        )
      }
      const coupon = await prisma.coupon.findUnique({
        where: { id: validated.couponId },
        include: { location: { select: { organizationId: true } } },
      })
      if (coupon?.location && coupon.location.organizationId !== ctx.organizationId) {
        return NextResponse.json({ error: 'Coupon gehört nicht zur Organisation.' }, { status: 403 })
      }
      if (!coupon) {
        return NextResponse.json({ error: 'Coupon nicht gefunden.' }, { status: 404 })
      }
    }

    if (validated.incentiveType === 'WALLET_CREDIT') {
      if (!validated.walletAmount || validated.walletAmount <= 0) {
        return NextResponse.json(
          { error: 'Bei Guthaben-Incentive muss ein positiver Betrag angegeben werden.' },
          { status: 400 }
        )
      }
    }

    const segment = await prisma.customerSegment.findFirst({
      where: { id: validated.segmentId, organizationId: ctx.organizationId },
    })
    if (!segment) {
      return NextResponse.json({ error: 'Segment nicht gefunden.' }, { status: 404 })
    }

    const incentive = await prisma.segmentIncentive.create({
      data: {
        organizationId: ctx.organizationId,
        segmentId: validated.segmentId,
        name: validated.name,
        incentiveType: validated.incentiveType,
        couponId: validated.couponId || null,
        personaliseCoupon: validated.personaliseCoupon ?? false,
        walletAmount: validated.walletAmount ? new Decimal(validated.walletAmount) : null,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        maxGrantsPerUser: validated.maxGrantsPerUser ?? 1,
        displayChannel: validated.displayChannel ?? 'BOTH',
        isActive: validated.isActive ?? true,
      },
      include: {
        segment: { select: { id: true, name: true } },
        coupon: { select: { id: true, code: true, name: true, type: true } },
      },
    })

    return NextResponse.json(incentive, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.errors }, { status: 400 })
    }
    console.error('Fehler beim Anlegen des Incentives:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
