export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/kunden/[id]/merkmale
 *
 * Returns pre-computed CustomerMetrics for a customer.
 * Returns 404 if no metrics exist yet (not yet calculated).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error
    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    // Verify customer belongs to org
    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const metrics = await prisma.customerMetrics.findUnique({
      where: { userId },
    })

    if (!metrics) {
      return NextResponse.json({ metrics: null })
    }

    return NextResponse.json({
      metrics: {
        // Aktivität
        activityStatus: metrics.activityStatus,
        daysSinceLastOrder: metrics.daysSinceLastOrder,
        daysSinceRegistration: metrics.daysSinceRegistration,
        preferredDayOfWeek: metrics.preferredDayOfWeek,
        preferredTimeSlot: metrics.preferredTimeSlot,
        // Wert
        ltv: Number(metrics.ltv),
        avgOrderValue: Number(metrics.avgOrderValue),
        orderFrequencyPerWeek: Number(metrics.orderFrequencyPerWeek),
        spend30d: Number(metrics.spend30d),
        totalOrders: metrics.totalOrders,
        firstOrderAt: metrics.firstOrderAt,
        lastOrderAt: metrics.lastOrderAt,
        customerTier: metrics.customerTier,
        // RFM
        rfmR: metrics.rfmR,
        rfmF: metrics.rfmF,
        rfmM: metrics.rfmM,
        rfmSegment: metrics.rfmSegment,
        // Trend
        frequencyTrend: metrics.frequencyTrend,
        spendTrend: metrics.spendTrend,
        orders30d: metrics.orders30d,
        orders30dPrev: metrics.orders30dPrev,
        spend30dPrev: Number(metrics.spend30dPrev),
        // Scores
        churnRiskScore: metrics.churnRiskScore,
        winBackScore: metrics.winBackScore,
        upsellScore: metrics.upsellScore,
        // Verhalten
        orderConsistencyScore: metrics.orderConsistencyScore,
        orderDiversityScore: metrics.orderDiversityScore,
        lunchRegularityPct: metrics.lunchRegularityPct ? Number(metrics.lunchRegularityPct) : null,
        avgLeadTimeHours: metrics.avgLeadTimeHours ? Number(metrics.avgLeadTimeHours) : null,
        // Engagement
        couponUsageRate: Number(metrics.couponUsageRate),
        walletUsageRate: Number(metrics.walletUsageRate),
        primaryChannel: metrics.primaryChannel,
        channelLoyaltyPct: Number(metrics.channelLoyaltyPct),
        // Meta
        calculatedAt: metrics.calculatedAt,
      },
    })
  } catch (err) {
    console.error('Fehler beim Abrufen der Merkmale:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
