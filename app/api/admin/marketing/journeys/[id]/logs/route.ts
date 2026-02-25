export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

export async function GET(
  request: NextRequest,
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
      select: { id: true },
    })
    if (!journey) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const nodeId = searchParams.get('nodeId')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '100'))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { journeyId: params.id }
    if (status) where.status = status
    if (nodeId) where.nodeId = nodeId

    const [logs, total] = await Promise.all([
      prisma.journeyLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nodeId: true,
          eventType: true,
          status: true,
          details: true,
          createdAt: true,
          participant: {
            select: {
              id: true,
              user: { select: { id: true, email: true, name: true } },
            },
          },
        },
      }),
      prisma.journeyLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit })
  } catch (error) {
    console.error('GET /api/admin/marketing/journeys/[id]/logs error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
