export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import {
  loadSingleUserAudienceData,
  computeSegmentAudience,
  type RulesCombination,
  type SegmentRule,
} from '@/lib/segment-audience'

/**
 * GET: Alle Segmente zurückgeben, in denen der Kunde aktuell Mitglied ist.
 * PROJ-22b: Bidirektionale Profil↔Segment-Verknüpfung.
 */
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

    const { id: userId } = await params

    // Prüfen ob Kunde zur Organisation gehört
    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId: ctx.organizationId },
      select: { id: true },
    })
    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Alle Segmente der Organisation laden
    const allSegments = await prisma.customerSegment.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true, description: true, rules: true, rulesCombination: true },
      orderBy: { name: 'asc' },
    })

    if (allSegments.length === 0) {
      return NextResponse.json({ segments: [] })
    }

    // Audience-Daten für diesen einzelnen User laden
    const userData = await loadSingleUserAudienceData(userId, ctx.organizationId)
    if (!userData) {
      return NextResponse.json({ segments: [] })
    }

    // Für jedes Segment prüfen ob der User Mitglied ist
    const matchingSegments: { id: string; name: string; description: string | null }[] = []
    for (const seg of allSegments) {
      const rules = (seg.rules as SegmentRule[]) ?? []
      const combination = (seg.rulesCombination as RulesCombination) ?? 'AND'
      const matchedIds = computeSegmentAudience([userData], rules, combination)
      if (matchedIds.includes(userId)) {
        matchingSegments.push({
          id: seg.id,
          name: seg.name,
          description: seg.description ?? null,
        })
      }
    }

    return NextResponse.json({ segments: matchingSegments })
  } catch (error) {
    console.error('Fehler bei Segmentzugehörigkeit:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
