export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  description: z.string().optional(),
  triggerType: z.enum(['EVENT', 'SEGMENT_ENTRY', 'DATE_BASED']),
  triggerConfig: z.record(z.unknown()).default({}),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { organizationId: ctx.organizationId }
    if (status && ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      where.status = status
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const journeys = await prisma.journey.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        triggerConfig: true,
        startDate: true,
        endDate: true,
        reEntryPolicy: true,
        conversionGoal: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: { where: { status: 'ACTIVE' } },
          },
        },
      },
    })

    // Compute conversion rates
    const journeysWithStats = await Promise.all(
      journeys.map(async (j) => {
        const [totalCount, convertedCount] = await Promise.all([
          prisma.journeyParticipant.count({ where: { journeyId: j.id } }),
          prisma.journeyParticipant.count({ where: { journeyId: j.id, status: 'CONVERTED' } }),
        ])
        return {
          ...j,
          activeParticipants: j._count.participants,
          totalParticipants: totalCount,
          conversionRate: totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0,
        }
      })
    )

    return NextResponse.json(journeysWithStats)
  } catch (error) {
    console.error('GET /api/admin/marketing/journeys error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { name, description, triggerType, triggerConfig } = parsed.data

    const journey = await prisma.journey.create({
      data: {
        organizationId: ctx.organizationId,
        name,
        description,
        triggerType,
        triggerConfig: triggerConfig as never,
        content: { nodes: [], edges: [] } as never,
        status: 'DRAFT',
      },
    })

    return NextResponse.json(journey, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/marketing/journeys error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
