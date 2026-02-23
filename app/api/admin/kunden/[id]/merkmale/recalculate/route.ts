export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import {
  computeCustomerMetrics,
  computeLtvQuintiles,
  type OrderInput,
} from '@/lib/calculate-customer-metrics'

const RATE_LIMIT_HOURS = 1

/**
 * POST /api/admin/kunden/[id]/merkmale/recalculate
 *
 * Manually triggers recalculation of CustomerMetrics for a single customer.
 * Rate-limited to once per hour per customer.
 */
export async function POST(
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

    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true, createdAt: true },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    // ── Rate-limit check ────────────────────────────────────────────────────

    const existing = await prisma.customerMetrics.findUnique({
      where: { userId },
      select: { calculatedAt: true },
    })
    if (existing) {
      const ageMs = Date.now() - existing.calculatedAt.getTime()
      if (ageMs < RATE_LIMIT_HOURS * 3600000) {
        const nextAllowedIn = Math.ceil((RATE_LIMIT_HOURS * 3600000 - ageMs) / 60000)
        return NextResponse.json(
          {
            error: `Neuberechnung erst in ${nextAllowedIn} Minute${nextAllowedIn === 1 ? '' : 'n'} wieder möglich.`,
            retryAfterMinutes: nextAllowedIn,
          },
          { status: 429 }
        )
      }
    }

    // ── Fetch order data ────────────────────────────────────────────────────

    const rawOrders = await prisma.order.findMany({
      where: {
        userId,
        status: { notIn: ['CANCELLED'] },
      },
      select: {
        id: true,
        createdAt: true,
        pickupDate: true,
        finalAmount: true,
        totalAmount: true,
        channel: true,
        couponRedemptions: { select: { id: true } },
        walletTransactions: {
          where: { type: 'ORDER_PAYMENT' },
          select: { id: true },
        },
        items: { select: { productNameSnapshot: true } },
      },
    })

    const orders: OrderInput[] = rawOrders.map(o => ({
      id: o.id,
      createdAt: o.createdAt,
      pickupDate: o.pickupDate,
      amount: Number(o.finalAmount ?? o.totalAmount),
      channel: o.channel ?? null,
      hasCoupon: o.couponRedemptions.length > 0,
      hasWallet: o.walletTransactions.length > 0,
      productNames: o.items.map(i => i.productNameSnapshot),
    }))

    // ── Org-relative M-score thresholds ────────────────────────────────────
    // Use cached LTV values from CustomerMetrics for other customers in the org

    const orgMetrics = await prisma.customerMetrics.findMany({
      where: { organizationId, userId: { not: userId } },
      select: { ltv: true },
    })
    const orgLtvValues = orgMetrics.map(m => Number(m.ltv))
    // Also include current customer's LTV in the distribution
    const currentLtv = orders.reduce((s, o) => s + o.amount, 0)
    orgLtvValues.push(currentLtv)

    const quintiles = computeLtvQuintiles(orgLtvValues)
    const orgAvgAov = orgLtvValues.length > 1
      ? orgLtvValues.reduce((s, v) => s + v, 0) / orgLtvValues.length
      : Math.max(1, currentLtv)

    // ── Compute ─────────────────────────────────────────────────────────────

    const result = computeCustomerMetrics({
      userId,
      organizationId,
      userCreatedAt: customer.createdAt,
      orders,
      orgM_p20: quintiles.p20,
      orgM_p40: quintiles.p40,
      orgM_p60: quintiles.p60,
      orgM_p80: quintiles.p80,
      orgAvgAov,
    })

    // ── Upsert ──────────────────────────────────────────────────────────────

    await prisma.customerMetrics.upsert({
      where: { userId },
      create: {
        userId,
        organizationId,
        activityStatus: result.activityStatus,
        daysSinceLastOrder: result.daysSinceLastOrder,
        daysSinceRegistration: result.daysSinceRegistration,
        preferredDayOfWeek: result.preferredDayOfWeek,
        preferredTimeSlot: result.preferredTimeSlot,
        ltv: result.ltv,
        avgOrderValue: result.avgOrderValue,
        orderFrequencyPerWeek: result.orderFrequencyPerWeek,
        spend30d: result.spend30d,
        totalOrders: result.totalOrders,
        firstOrderAt: result.firstOrderAt,
        lastOrderAt: result.lastOrderAt,
        customerTier: result.customerTier,
        rfmR: result.rfmR,
        rfmF: result.rfmF,
        rfmM: result.rfmM,
        rfmSegment: result.rfmSegment,
        frequencyTrend: result.frequencyTrend,
        spendTrend: result.spendTrend,
        orders30d: result.orders30d,
        orders30dPrev: result.orders30dPrev,
        spend30dPrev: result.spend30dPrev,
        churnRiskScore: result.churnRiskScore,
        winBackScore: result.winBackScore,
        upsellScore: result.upsellScore,
        orderConsistencyScore: result.orderConsistencyScore,
        orderDiversityScore: result.orderDiversityScore,
        lunchRegularityPct: result.lunchRegularityPct,
        avgLeadTimeHours: result.avgLeadTimeHours,
        couponUsageRate: result.couponUsageRate,
        walletUsageRate: result.walletUsageRate,
        primaryChannel: result.primaryChannel,
        channelLoyaltyPct: result.channelLoyaltyPct,
        calculatedAt: result.calculatedAt,
      },
      update: {
        activityStatus: result.activityStatus,
        daysSinceLastOrder: result.daysSinceLastOrder,
        daysSinceRegistration: result.daysSinceRegistration,
        preferredDayOfWeek: result.preferredDayOfWeek,
        preferredTimeSlot: result.preferredTimeSlot,
        ltv: result.ltv,
        avgOrderValue: result.avgOrderValue,
        orderFrequencyPerWeek: result.orderFrequencyPerWeek,
        spend30d: result.spend30d,
        totalOrders: result.totalOrders,
        firstOrderAt: result.firstOrderAt,
        lastOrderAt: result.lastOrderAt,
        customerTier: result.customerTier,
        rfmR: result.rfmR,
        rfmF: result.rfmF,
        rfmM: result.rfmM,
        rfmSegment: result.rfmSegment,
        frequencyTrend: result.frequencyTrend,
        spendTrend: result.spendTrend,
        orders30d: result.orders30d,
        orders30dPrev: result.orders30dPrev,
        spend30dPrev: result.spend30dPrev,
        churnRiskScore: result.churnRiskScore,
        winBackScore: result.winBackScore,
        upsellScore: result.upsellScore,
        orderConsistencyScore: result.orderConsistencyScore,
        orderDiversityScore: result.orderDiversityScore,
        lunchRegularityPct: result.lunchRegularityPct,
        avgLeadTimeHours: result.avgLeadTimeHours,
        couponUsageRate: result.couponUsageRate,
        walletUsageRate: result.walletUsageRate,
        primaryChannel: result.primaryChannel,
        channelLoyaltyPct: result.channelLoyaltyPct,
        calculatedAt: result.calculatedAt,
      },
    })

    return NextResponse.json({
      message: 'Merkmale erfolgreich neu berechnet',
      calculatedAt: result.calculatedAt,
    })
  } catch (err) {
    console.error('Fehler bei Neuberechnung der Merkmale:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
