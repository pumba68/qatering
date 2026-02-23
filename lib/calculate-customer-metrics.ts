/**
 * PROJ-21: Pure computation function for CustomerMetrics.
 * No DB calls — all I/O is handled by the callers (cron job / recalculate route).
 */

// ─── Input / Output Types ──────────────────────────────────────────────────

export interface OrderInput {
  id: string
  createdAt: Date
  pickupDate: Date
  /** finalAmount ?? totalAmount in Euros */
  amount: number
  channel: string | null
  hasCoupon: boolean
  hasWallet: boolean
  productNames: (string | null)[]
}

export interface MetricsInput {
  userId: string
  organizationId: string
  userCreatedAt: Date
  orders: OrderInput[]
  /** Org-relative LTV percentile thresholds for M-score (from other customers) */
  orgM_p20: number
  orgM_p40: number
  orgM_p60: number
  orgM_p80: number
  /** Org average AOV for Upsell-Score */
  orgAvgAov: number
  now?: Date
}

export type ActivityStatus = 'NEU' | 'AKTIV' | 'GELEGENTLICH' | 'SCHLAFEND' | 'ABGEWANDERT'
export type CustomerTier = 'STANDARD' | 'BRONZE' | 'SILBER' | 'GOLD' | 'PLATIN'
export type RfmSegment =
  | 'NEW_CUSTOMER' | 'CHAMPION' | 'LOYAL' | 'POTENTIAL'
  | 'NEEDS_ATTENTION' | 'AT_RISK' | 'CANT_LOSE' | 'HIBERNATING'
export type TrendDirection = 'WACHSEND' | 'STABIL' | 'RUECKLAEUFIG'

export interface MetricsResult {
  userId: string
  organizationId: string
  // Aktivität
  activityStatus: ActivityStatus
  daysSinceLastOrder: number | null
  daysSinceRegistration: number
  preferredDayOfWeek: number | null
  preferredTimeSlot: string | null
  // Wert
  ltv: number
  avgOrderValue: number
  orderFrequencyPerWeek: number
  spend30d: number
  totalOrders: number
  firstOrderAt: Date | null
  lastOrderAt: Date | null
  customerTier: CustomerTier
  // RFM
  rfmR: number
  rfmF: number
  rfmM: number
  rfmSegment: RfmSegment
  // Trend
  frequencyTrend: TrendDirection
  spendTrend: TrendDirection
  orders30d: number
  orders30dPrev: number
  spend30dPrev: number
  // Scores
  churnRiskScore: number
  winBackScore: number | null
  upsellScore: number
  // Verhalten
  orderConsistencyScore: number | null
  orderDiversityScore: number
  lunchRegularityPct: number | null
  avgLeadTimeHours: number | null
  // Engagement
  couponUsageRate: number
  walletUsageRate: number
  primaryChannel: string | null
  channelLoyaltyPct: number
  // Meta
  calculatedAt: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length
}

/** Returns mode (most common) value of an array, null if empty */
function mode<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  const counts = new Map<T, number>()
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best: T | null = null
  let bestCount = 0
  for (const [v, c] of Array.from(counts.entries())) {
    if (c > bestCount) { bestCount = c; best = v }
  }
  return best
}

function timeSlot(hour: number): string {
  if (hour < 10) return 'BREAKFAST'
  if (hour < 14) return 'LUNCH'
  if (hour < 17) return 'AFTERNOON'
  return 'EVENING'
}

function toTier(ltv: number): CustomerTier {
  if (ltv >= 5000) return 'PLATIN'
  if (ltv >= 1500) return 'GOLD'
  if (ltv >= 500)  return 'SILBER'
  if (ltv >= 100)  return 'BRONZE'
  return 'STANDARD'
}

function rfmMScore(ltv: number, p20: number, p40: number, p60: number, p80: number): number {
  if (ltv >= p80) return 5
  if (ltv >= p60) return 4
  if (ltv >= p40) return 3
  if (ltv >= p20) return 2
  return 1
}

function rfmRScore(daysSince: number | null): number {
  if (daysSince === null) return 1
  if (daysSince <= 7)   return 5
  if (daysSince <= 30)  return 4
  if (daysSince <= 60)  return 3
  if (daysSince <= 120) return 2
  return 1
}

function rfmFScore(freqPerWeek: number): number {
  if (freqPerWeek >= 3)    return 5
  if (freqPerWeek >= 1.5)  return 4
  if (freqPerWeek >= 0.75) return 3
  if (freqPerWeek >= 0.25) return 2
  return 1
}

function deriveRfmSegment(r: number, f: number, m: number, firstOrderDaysAgo: number | null): RfmSegment {
  if (firstOrderDaysAgo !== null && firstOrderDaysAgo <= 30) return 'NEW_CUSTOMER'
  if (r >= 4 && f >= 4 && m >= 4) return 'CHAMPION'
  if (r >= 3 && f >= 3 && m >= 3) return 'LOYAL'
  if (r >= 4 && f <= 2 && m <= 2) return 'POTENTIAL'
  if (r === 3 && f >= 3 && m >= 3) return 'NEEDS_ATTENTION'
  if (r <= 2 && f >= 4 && m >= 4) return 'CANT_LOSE'
  if (r >= 2 && r <= 3 && f >= 3 && m >= 3) return 'AT_RISK'
  return 'HIBERNATING'
}

function trendDirection(current: number, previous: number): TrendDirection {
  const pct = (current - previous) / Math.max(1, previous)
  if (pct > 0.25) return 'WACHSEND'
  if (pct < -0.25) return 'RUECKLAEUFIG'
  return 'STABIL'
}

// ─── Main Computation ─────────────────────────────────────────────────────────

export function computeCustomerMetrics(input: MetricsInput): MetricsResult {
  const {
    userId, organizationId, userCreatedAt, orders,
    orgM_p20, orgM_p40, orgM_p60, orgM_p80, orgAvgAov,
  } = input
  const now = input.now ?? new Date()

  // Sort orders ascending
  const sorted = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const totalOrders = sorted.length
  const firstOrderAt = sorted[0]?.createdAt ?? null
  const lastOrderAt = sorted[sorted.length - 1]?.createdAt ?? null

  // ── Aktivität ────────────────────────────────────────────────────────────

  const daysSinceRegistration = Math.floor((now.getTime() - userCreatedAt.getTime()) / 86400000)
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((now.getTime() - lastOrderAt.getTime()) / 86400000)
    : null

  let activityStatus: ActivityStatus
  if (totalOrders === 0) {
    activityStatus = 'NEU'
  } else if (daysSinceLastOrder! <= 30) {
    activityStatus = 'AKTIV'
  } else if (daysSinceLastOrder! <= 90) {
    activityStatus = 'GELEGENTLICH'
  } else if (daysSinceLastOrder! <= 180) {
    activityStatus = 'SCHLAFEND'
  } else {
    activityStatus = 'ABGEWANDERT'
  }

  // Edge: never ordered but registered > 90 days → also ABGEWANDERT
  if (totalOrders === 0 && daysSinceRegistration > 90) {
    activityStatus = 'ABGEWANDERT'
  }

  const preferredDayOfWeek = mode(sorted.map(o => o.createdAt.getDay()))
  const preferredTimeSlot = mode(sorted.map(o => timeSlot(o.createdAt.getHours())))

  // ── Wert ─────────────────────────────────────────────────────────────────

  const ltv = sorted.reduce((s, o) => s + o.amount, 0)
  const avgOrderValue = totalOrders > 0 ? ltv / totalOrders : 0
  const weeksSinceFirst = firstOrderAt
    ? Math.max(1, (now.getTime() - firstOrderAt.getTime()) / (7 * 86400000))
    : 1
  const orderFrequencyPerWeek = totalOrders / weeksSinceFirst

  const cutoff30 = new Date(now.getTime() - 30 * 86400000)
  const cutoff60 = new Date(now.getTime() - 60 * 86400000)
  const orders30d = sorted.filter(o => o.createdAt >= cutoff30).length
  const orders30dPrev = sorted.filter(o => o.createdAt >= cutoff60 && o.createdAt < cutoff30).length
  const spend30d = sorted.filter(o => o.createdAt >= cutoff30).reduce((s, o) => s + o.amount, 0)
  const spend30dPrev = sorted.filter(o => o.createdAt >= cutoff60 && o.createdAt < cutoff30).reduce((s, o) => s + o.amount, 0)

  const customerTier = toTier(ltv)

  // ── RFM ──────────────────────────────────────────────────────────────────

  const rfmR = rfmRScore(daysSinceLastOrder)
  const rfmF = rfmFScore(orderFrequencyPerWeek)
  const rfmM = rfmMScore(ltv, orgM_p20, orgM_p40, orgM_p60, orgM_p80)
  const firstOrderDaysAgo = firstOrderAt
    ? Math.floor((now.getTime() - firstOrderAt.getTime()) / 86400000)
    : null
  const rfmSegment = deriveRfmSegment(rfmR, rfmF, rfmM, firstOrderDaysAgo)

  // ── Trend ─────────────────────────────────────────────────────────────────

  const frequencyTrend = trendDirection(orders30d, orders30dPrev)
  const spendTrend = trendDirection(spend30d, spend30dPrev)

  // ── Churn-Risk-Score ──────────────────────────────────────────────────────

  let churnRisk = 0
  if (daysSinceLastOrder !== null) {
    if (daysSinceLastOrder > 90)      churnRisk += 40
    else if (daysSinceLastOrder > 60) churnRisk += 30
    else if (daysSinceLastOrder > 30) churnRisk += 15
    else if (daysSinceLastOrder > 14) churnRisk += 5
  } else {
    // Never ordered
    churnRisk += daysSinceRegistration > 30 ? 40 : 10
  }
  if (frequencyTrend === 'RUECKLAEUFIG') {
    const drop = (orders30dPrev - orders30d) / Math.max(1, orders30dPrev)
    churnRisk += Math.min(35, Math.round(drop * 50))
  }
  if (spendTrend === 'RUECKLAEUFIG') {
    const drop = (spend30dPrev - spend30d) / Math.max(1, spend30dPrev)
    churnRisk += Math.min(25, Math.round(drop * 35))
  }
  const churnRiskScore = Math.min(100, churnRisk)

  // ── Win-Back-Score (only for ABGEWANDERT) ────────────────────────────────

  let winBackScore: number | null = null
  if (activityStatus === 'ABGEWANDERT') {
    const ltvScore = Math.min(50, (ltv / 200) * 50)
    const urgencyScore = (daysSinceLastOrder !== null && daysSinceLastOrder < 365) ? 30 : 15
    const tierBonus = { PLATIN: 20, GOLD: 15, SILBER: 10, BRONZE: 5, STANDARD: 0 }[customerTier]
    winBackScore = Math.min(100, Math.round(ltvScore + urgencyScore + tierBonus))
  }

  // ── Upsell-Score ─────────────────────────────────────────────────────────

  const aovGap = Math.max(0, 1 - (avgOrderValue / Math.max(0.01, orgAvgAov)))
  const freqNorm = Math.min(1, orderFrequencyPerWeek / 3.0)
  const upsellScore = Math.round((aovGap * 0.6 + freqNorm * 0.4) * 100)

  // ── Konsistenz-Score ──────────────────────────────────────────────────────

  let orderConsistencyScore: number | null = null
  if (sorted.length >= 3) {
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) / 86400000)
    }
    const sd = stdDev(intervals)
    const avg = mean(intervals)
    orderConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - (sd / Math.max(1, avg * 2)) * 100)))
  }

  // ── Diversitäts-Score ────────────────────────────────────────────────────

  const allNames = sorted.flatMap(o => o.productNames.filter((n): n is string => n !== null))
  const uniqueProducts = new Set(allNames).size
  const totalItems = allNames.length
  const diversityRatio = totalItems > 0 ? Math.min(1, uniqueProducts / totalItems) : 0
  const orderDiversityScore = Math.round(diversityRatio * 100)

  // ── Mittagsfrequenz ───────────────────────────────────────────────────────

  let lunchRegularityPct: number | null = null
  if (firstOrderAt && daysSinceRegistration >= 7) {
    const firstOrderMs = firstOrderAt.getTime()
    let totalWorkdays = 0
    for (let d = 0; d < Math.floor((now.getTime() - firstOrderMs) / 86400000); d++) {
      const dow = new Date(firstOrderMs + d * 86400000).getDay()
      if (dow >= 1 && dow <= 5) totalWorkdays++
    }
    const orderedDates = new Set(
      sorted
        .filter(o => { const d = o.createdAt.getDay(); return d >= 1 && d <= 5 })
        .map(o => o.createdAt.toISOString().split('T')[0])
    )
    lunchRegularityPct = totalWorkdays > 0
      ? Math.round((orderedDates.size / totalWorkdays) * 1000) / 1000
      : null
  }

  // ── Ø Vorlaufzeit ─────────────────────────────────────────────────────────

  const leadTimes = sorted
    .map(o => (o.pickupDate.getTime() - o.createdAt.getTime()) / 3600000)
    .filter(h => h >= 0)
  const avgLeadTimeHours = leadTimes.length > 0
    ? Math.round(mean(leadTimes) * 10) / 10
    : null

  // ── Engagement ────────────────────────────────────────────────────────────

  const couponUsageRate = totalOrders > 0
    ? Math.round((sorted.filter(o => o.hasCoupon).length / totalOrders) * 1000) / 1000
    : 0
  const walletUsageRate = totalOrders > 0
    ? Math.round((sorted.filter(o => o.hasWallet).length / totalOrders) * 1000) / 1000
    : 0
  const primaryChannel = mode(sorted.map(o => o.channel).filter((c): c is string => c !== null))
  const channelLoyaltyPct = (totalOrders > 0 && primaryChannel)
    ? Math.round((sorted.filter(o => o.channel === primaryChannel).length / totalOrders) * 1000) / 1000
    : 0

  return {
    userId,
    organizationId,
    activityStatus,
    daysSinceLastOrder,
    daysSinceRegistration,
    preferredDayOfWeek,
    preferredTimeSlot,
    ltv: Math.round(ltv * 100) / 100,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    orderFrequencyPerWeek: Math.round(orderFrequencyPerWeek * 1000) / 1000,
    spend30d: Math.round(spend30d * 100) / 100,
    totalOrders,
    firstOrderAt,
    lastOrderAt,
    customerTier,
    rfmR,
    rfmF,
    rfmM,
    rfmSegment,
    frequencyTrend,
    spendTrend,
    orders30d,
    orders30dPrev,
    spend30dPrev: Math.round(spend30dPrev * 100) / 100,
    churnRiskScore,
    winBackScore,
    upsellScore,
    orderConsistencyScore,
    orderDiversityScore,
    lunchRegularityPct,
    avgLeadTimeHours,
    couponUsageRate,
    walletUsageRate,
    primaryChannel,
    channelLoyaltyPct,
    calculatedAt: now,
  }
}

// ─── Org Quintile Helper ──────────────────────────────────────────────────────

/** Compute p20/p40/p60/p80 from an array of LTV values */
export function computeLtvQuintiles(ltvValues: number[]): {
  p20: number; p40: number; p60: number; p80: number
} {
  if (ltvValues.length === 0) return { p20: 0, p40: 0, p60: 0, p80: 0 }
  const sorted = [...ltvValues].sort((a, b) => a - b)
  const pct = (p: number) => sorted[Math.floor((sorted.length - 1) * p)]
  return { p20: pct(0.2), p40: pct(0.4), p60: pct(0.6), p80: pct(0.8) }
}
