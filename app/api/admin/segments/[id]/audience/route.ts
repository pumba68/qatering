export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  computeSegmentAudienceWithRuleMatch,
  ruleToLabel,
  type RulesCombination,
  type SegmentRule,
} from '@/lib/segment-audience'

/**
 * GET: Zielgruppe eines Segments (Anzahl und optional Liste).
 * Query:
 *   countOnly=true → nur { count }
 *   showRuleMatch=true → pro User welche Regeln erfüllt (ruleLabels, usersWithRules)
 *   limit=N → max. N Einträge (default 500, max 2000).
 */
export async function GET(
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
    const segment = await prisma.customerSegment.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'
    const showRuleMatch = searchParams.get('showRuleMatch') === 'true'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(0, parseInt(limitParam, 10)), 2000) : 500

    const audienceData = await loadAudienceData(
      ctx.organizationId,
      ctx.allowedLocationIds
    )
    const rules = (segment.rules as SegmentRule[]) ?? []
    const combination = (segment.rulesCombination as RulesCombination) ?? 'AND'

    if (countOnly) {
      const userIds = computeSegmentAudienceIds(audienceData, rules, combination, undefined)
      return NextResponse.json({ count: userIds.length })
    }

    if (showRuleMatch) {
      const withRules = computeSegmentAudienceWithRuleMatch(
        audienceData,
        rules,
        combination,
        limit
      )
      const userIds = withRules.map((w) => w.userId)
      const ruleLabels = rules.map((r) => ruleToLabel(r))
      let users: { id: string; email: string | null; name: string | null }[] = []
      if (userIds.length > 0) {
        users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      }
      const usersWithRules = withRules.map((w) => {
        const u = users.find((x) => x.id === w.userId)
        return {
          id: w.userId,
          email: u?.email ?? null,
          name: u?.name ?? null,
          matchedRuleIndices: w.matchedRuleIndices,
          matchedRuleLabels: w.matchedRuleIndices.map((i) => ruleLabels[i]),
        }
      })
      return NextResponse.json({
        count: withRules.length,
        ruleLabels,
        usersWithRules,
      })
    }

    const userIds = computeSegmentAudienceIds(audienceData, rules, combination, limit)
    let users: { id: string; email: string | null; name: string | null }[] = []
    if (userIds.length > 0) {
      users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    }

    return NextResponse.json({
      count: userIds.length,
      userIds,
      users,
    })
  } catch (error) {
    console.error('Fehler bei Zielgruppen-Berechnung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
