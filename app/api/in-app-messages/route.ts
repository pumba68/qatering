import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@/src/generated/prisma'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  type RulesCombination,
} from '@/lib/segment-audience'

/**
 * GET: In-App-Nachrichten für den eingeloggten User.
 * Nur aktive Nachrichten, deren Segment den User enthält.
 * Query: displayPlace=menu|wallet|dashboard (optional, filtert nach Anzeigeort).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json(
        { error: 'Session ungültig' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const displayPlace = searchParams.get('displayPlace')

    const now = new Date()
    const where: Prisma.InAppMessageWhereInput = {
      organizationId: user.organizationId,
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    }
    if (displayPlace === 'menu' || displayPlace === 'wallet' || displayPlace === 'dashboard') {
      where.displayPlace = displayPlace as 'menu' | 'wallet' | 'dashboard'
    }

    const messages = await prisma.inAppMessage.findMany({
      where,
      include: { segment: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
    })
    if (messages.length === 0) return NextResponse.json([])

    const audienceData = await loadAudienceData(user.organizationId, null)
    const segmentIds = Array.from(new Set(messages.map((m) => m.segmentId)))
    const userIdsBySegment = new Map<string, string[]>()
    for (const segId of segmentIds) {
      const segment = await prisma.customerSegment.findUnique({
        where: { id: segId },
        select: { rules: true, rulesCombination: true },
      })
      if (!segment) continue
      const ids = computeSegmentAudienceIds(
        audienceData,
        segment.rules,
        (segment.rulesCombination as RulesCombination) ?? 'AND'
      )
      userIdsBySegment.set(segId, ids)
    }

    const forUser = messages.filter((m) => {
      const ids = userIdsBySegment.get(m.segmentId)
      return ids?.includes(userId)
    })

    return NextResponse.json(forUser)
  } catch (error) {
    console.error('Fehler beim Abrufen der In-App-Nachrichten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
