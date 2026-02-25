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
      select: { id: true, name: true, status: true, content: true },
    })
    if (!journey) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const days = Math.min(90, parseInt(searchParams.get('days') ?? '30'))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalEntered,
      activeCount,
      convertedCount,
      failedCount,
      exitedCount,
      completedCount,
    ] = await Promise.all([
      prisma.journeyParticipant.count({ where: { journeyId: params.id } }),
      prisma.journeyParticipant.count({ where: { journeyId: params.id, status: 'ACTIVE' } }),
      prisma.journeyParticipant.count({ where: { journeyId: params.id, status: 'CONVERTED' } }),
      prisma.journeyParticipant.count({ where: { journeyId: params.id, status: 'FAILED' } }),
      prisma.journeyParticipant.count({ where: { journeyId: params.id, status: 'EXITED' } }),
      prisma.journeyParticipant.count({ where: { journeyId: params.id, status: 'COMPLETED' } }),
    ])

    // Entries per day (last N days)
    const dailyLogs = await prisma.journeyLog.groupBy({
      by: ['eventType'],
      where: {
        journeyId: params.id,
        eventType: 'ENTERED',
        createdAt: { gte: since },
      },
      _count: { id: true },
    })

    // Node-level participant counts
    const nodeStats = await prisma.journeyParticipant.groupBy({
      by: ['currentNodeId'],
      where: { journeyId: params.id, status: 'ACTIVE' },
      _count: { id: true },
    })

    const conversionRate = totalEntered > 0
      ? Math.round((convertedCount / totalEntered) * 100 * 10) / 10
      : 0

    return NextResponse.json({
      totalEntered,
      activeCount,
      convertedCount,
      failedCount,
      exitedCount,
      completedCount,
      conversionRate,
      dailyLogs,
      nodeStats: nodeStats.map((s) => ({
        nodeId: s.currentNodeId,
        count: s._count.id,
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/marketing/journeys/[id]/analytics error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
