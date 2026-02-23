export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max (Vercel Pro)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  computeCustomerMetrics,
  computeLtvQuintiles,
  type OrderInput,
} from '@/lib/calculate-customer-metrics'

/**
 * GET /api/cron/customer-metrics
 *
 * Daily cron job (03:00 UTC) that recalculates CustomerMetrics for all
 * customers across all organizations.
 *
 * Vercel Cron configuration in vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/customer-metrics", "schedule": "0 3 * * *" }]
 * }
 *
 * Authorization: Vercel sends `Authorization: Bearer <CRON_SECRET>` header.
 */
export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let totalProcessed = 0
  let totalErrors = 0

  try {
    // ── Fetch all organizations ──────────────────────────────────────────────

    const organizations = await prisma.organization.findMany({
      select: { id: true },
    })

    for (const org of organizations) {
      try {
        await processOrganization(org.id, now)
        totalProcessed++
      } catch (err) {
        console.error(`[CronMetrics] Error for org ${org.id}:`, err)
        totalErrors++
      }
    }

    console.log(`[CronMetrics] Done. Orgs processed: ${totalProcessed}, errors: ${totalErrors}`)
    return NextResponse.json({
      message: 'CustomerMetrics recalculation complete',
      orgsProcessed: totalProcessed,
      errors: totalErrors,
      calculatedAt: now,
    })
  } catch (err) {
    console.error('[CronMetrics] Fatal error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

async function processOrganization(organizationId: string, now: Date) {
  // ── Fetch all customers of this org ─────────────────────────────────────

  const customers = await prisma.user.findMany({
    where: { organizationId, role: 'CUSTOMER' },
    select: { id: true, createdAt: true },
  })

  if (customers.length === 0) return

  // ── Fetch all non-cancelled orders for the org ───────────────────────────

  const allOrders = await prisma.order.findMany({
    where: {
      user: { organizationId },
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      id: true,
      userId: true,
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

  // Group orders by userId
  const ordersByUser = new Map<string, OrderInput[]>()
  for (const o of allOrders) {
    if (!ordersByUser.has(o.userId)) ordersByUser.set(o.userId, [])
    ordersByUser.get(o.userId)!.push({
      id: o.id,
      createdAt: o.createdAt,
      pickupDate: o.pickupDate,
      amount: Number(o.finalAmount ?? o.totalAmount),
      channel: o.channel ?? null,
      hasCoupon: o.couponRedemptions.length > 0,
      hasWallet: o.walletTransactions.length > 0,
      productNames: o.items.map(i => i.productNameSnapshot),
    })
  }

  // ── Compute org-level LTV distribution (for M-score) ────────────────────

  const ltvByUser = new Map<string, number>()
  for (const [uid, orders] of Array.from(ordersByUser.entries())) {
    ltvByUser.set(uid, orders.reduce((s, o) => s + o.amount, 0))
  }
  // Customers with no orders get LTV=0
  for (const c of customers) {
    if (!ltvByUser.has(c.id)) ltvByUser.set(c.id, 0)
  }

  const allLtvValues = Array.from(ltvByUser.values())
  const quintiles = computeLtvQuintiles(allLtvValues)
  const orgAvgAov = allLtvValues.length > 0
    ? allLtvValues.reduce((s, v) => s + v, 0) / Math.max(1, allLtvValues.length)
    : 1

  // ── Compute and upsert metrics for each customer ─────────────────────────

  const upserts = customers.map(customer => {
    const orders = ordersByUser.get(customer.id) ?? []
    const result = computeCustomerMetrics({
      userId: customer.id,
      organizationId,
      userCreatedAt: customer.createdAt,
      orders,
      orgM_p20: quintiles.p20,
      orgM_p40: quintiles.p40,
      orgM_p60: quintiles.p60,
      orgM_p80: quintiles.p80,
      orgAvgAov,
      now,
    })

    const payload = {
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
    }

    return prisma.customerMetrics.upsert({
      where: { userId: customer.id },
      create: { userId: customer.id, ...payload },
      update: payload,
    })
  })

  // Process in batches of 50 to avoid overwhelming the DB
  for (let i = 0; i < upserts.length; i += 50) {
    await Promise.all(upserts.slice(i, i + 50))
  }

  console.log(`[CronMetrics] Org ${organizationId}: ${customers.length} customers updated`)
}
