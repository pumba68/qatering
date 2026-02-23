/**
 * PROJ-4 / PROJ-22: Berechnung der Segment-Zielgruppe (Audience) anhand von Regeln.
 * Regeln: [{ attribute, operator, value }], Kombination AND | OR.
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@/src/generated/prisma/runtime/library'
import {
  SEGMENT_ATTRIBUTE_REGISTRY,
  PERCENT_FIELD_KEYS,
  getAttributeByKey,
  getOperatorLabel,
} from '@/lib/segment-attribute-registry'

export type SegmentRule = {
  attribute: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'has_set' | 'has_not_set'
  value: string | number | string[] | number[] | null
}

export type RulesInput = SegmentRule[]
export type RulesCombination = 'AND' | 'OR'

/** Unterstützte Attribute für Segment-Regeln (Legacy-Compat – nutze SEGMENT_ATTRIBUTE_REGISTRY direkt) */
export const SEGMENT_ATTRIBUTES = SEGMENT_ATTRIBUTE_REGISTRY

/** Aggregierte CustomerMetrics-Felder pro User */
export type CustomerMetricsFields = {
  activityStatus: string
  daysSinceLastOrder: number | null
  daysSinceRegistration: number
  preferredDayOfWeek: number | null
  preferredTimeSlot: string | null
  ltv: number
  avgOrderValue: number
  orderFrequencyPerWeek: number
  spend30d: number
  totalOrders: number
  customerTier: string
  rfmSegment: string
  rfmR: number
  rfmF: number
  rfmM: number
  frequencyTrend: string
  spendTrend: string
  orders30d: number
  churnRiskScore: number
  winBackScore: number | null
  upsellScore: number
  orderConsistencyScore: number | null
  orderDiversityScore: number
  lunchRegularityPct: number | null   // gespeichert 0.0–1.0
  avgLeadTimeHours: number | null
  couponUsageRate: number             // gespeichert 0.0–1.0
  walletUsageRate: number             // gespeichert 0.0–1.0
  primaryChannel: string | null
  channelLoyaltyPct: number           // gespeichert 0.0–1.0
}

/** Aggregierte Kundendaten pro User (für Regelauswertung) */
export type UserAudienceData = {
  userId: string
  orderCount: number
  lastOrderDays: number | null // Tage seit letzter Bestellung; null = keine Bestellung
  totalSpent: number
  locationIds: string[]
  companyIds: string[]
  registeredAt: Date
  role: string
  metrics: CustomerMetricsFields | null  // null = kein Metrics-Eintrag → von Metrics-Regeln ausgeschlossen
  preferenceKeys: Set<string>             // EXPLICIT, nicht-ignorierte CustomerPreference-Keys
}

function toNumber(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') return parseFloat(v) || 0
  return 0
}

function numericMatch(v: number, op: string, val: unknown): boolean {
  const n = toNumber(val)
  if (op === 'eq') return Math.abs(v - n) < 0.001
  if (op === 'ne') return Math.abs(v - n) >= 0.001
  if (op === 'gt') return v > n
  if (op === 'gte') return v >= n
  if (op === 'lt') return v < n
  if (op === 'lte') return v <= n
  if (op === 'in') return Array.isArray(val) && val.map(toNumber).some((x) => Math.abs(v - x) < 0.001)
  if (op === 'not_in') return Array.isArray(val) && !val.map(toNumber).some((x) => Math.abs(v - x) < 0.001)
  return false
}

function enumMatch(v: string, op: string, val: unknown): boolean {
  if (op === 'eq') return v === String(val)
  if (op === 'ne') return v !== String(val)
  if (op === 'in') return Array.isArray(val) && val.map(String).includes(v)
  if (op === 'not_in') return Array.isArray(val) && !val.map(String).includes(v)
  return false
}

function matchRule(rule: SegmentRule, data: UserAudienceData): boolean {
  const op = rule.operator
  const val = rule.value

  switch (rule.attribute) {
    // ── Legacy Stammdaten (USER) ──────────────────────────────────────────────
    case 'orderCount': {
      return numericMatch(data.orderCount, op, val)
    }
    case 'lastOrderDays': {
      const v = data.lastOrderDays
      if (v === null) {
        if (op === 'gt' || op === 'gte') return true
        if (op === 'eq' || op === 'lt' || op === 'lte') return false
        if (op === 'ne') return true
        return false
      }
      return numericMatch(v, op, val)
    }
    case 'totalSpent': {
      return numericMatch(data.totalSpent, op, val)
    }
    case 'locationId': {
      const ids = Array.isArray(val) ? val.map(String) : [String(val)]
      if (op === 'eq' || op === 'in') return ids.some((x) => data.locationIds.includes(x))
      if (op === 'ne' || op === 'not_in') return !ids.some((x) => data.locationIds.includes(x))
      return false
    }
    case 'companyId': {
      const ids = Array.isArray(val) ? val.map(String) : [String(val)]
      if (op === 'eq' || op === 'in') return ids.some((x) => data.companyIds.includes(x))
      if (op === 'ne' || op === 'not_in') return !ids.some((x) => data.companyIds.includes(x))
      return false
    }
    case 'registeredInLastDays': {
      const n = toNumber(val)
      const now = new Date()
      const daysSince = Math.floor((now.getTime() - data.registeredAt.getTime()) / (24 * 60 * 60 * 1000))
      return numericMatch(daysSince, op, val)
    }
    case 'role': {
      const userRole = data.role || 'CUSTOMER'
      return enumMatch(userRole, op, val)
    }

    // ── CustomerMetrics: Aktivität & Status ───────────────────────────────────
    case 'activityStatus': {
      if (!data.metrics) return false
      return enumMatch(data.metrics.activityStatus, op, val)
    }
    case 'daysSinceLastOrder': {
      if (!data.metrics) return false
      if (data.metrics.daysSinceLastOrder === null) {
        if (op === 'gt' || op === 'gte') return true
        if (op === 'eq' || op === 'lt' || op === 'lte') return false
        if (op === 'ne') return true
        return false
      }
      return numericMatch(data.metrics.daysSinceLastOrder, op, val)
    }
    case 'daysSinceRegistration': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.daysSinceRegistration, op, val)
    }
    case 'preferredDayOfWeek': {
      if (!data.metrics || data.metrics.preferredDayOfWeek === null) return false
      return enumMatch(String(data.metrics.preferredDayOfWeek), op, val)
    }
    case 'preferredTimeSlot': {
      if (!data.metrics || data.metrics.preferredTimeSlot === null) return false
      return enumMatch(data.metrics.preferredTimeSlot, op, val)
    }

    // ── CustomerMetrics: Kundenwert & Metriken ────────────────────────────────
    case 'ltv': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.ltv, op, val)
    }
    case 'avgOrderValue': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.avgOrderValue, op, val)
    }
    case 'orderFrequencyPerWeek': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.orderFrequencyPerWeek, op, val)
    }
    case 'spend30d': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.spend30d, op, val)
    }
    case 'totalOrders': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.totalOrders, op, val)
    }
    case 'customerTier': {
      if (!data.metrics) return false
      return enumMatch(data.metrics.customerTier, op, val)
    }

    // ── CustomerMetrics: RFM-Profil ───────────────────────────────────────────
    case 'rfmSegment': {
      if (!data.metrics) return false
      return enumMatch(data.metrics.rfmSegment, op, val)
    }
    case 'rfmR': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.rfmR, op, val)
    }
    case 'rfmF': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.rfmF, op, val)
    }
    case 'rfmM': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.rfmM, op, val)
    }

    // ── CustomerMetrics: Trends ───────────────────────────────────────────────
    case 'frequencyTrend': {
      if (!data.metrics) return false
      return enumMatch(data.metrics.frequencyTrend, op, val)
    }
    case 'spendTrend': {
      if (!data.metrics) return false
      return enumMatch(data.metrics.spendTrend, op, val)
    }
    case 'orders30d': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.orders30d, op, val)
    }

    // ── CustomerMetrics: Risiko & Potenzial ───────────────────────────────────
    case 'churnRiskScore': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.churnRiskScore, op, val)
    }
    case 'winBackScore': {
      if (!data.metrics || data.metrics.winBackScore === null) return false
      return numericMatch(data.metrics.winBackScore, op, val)
    }
    case 'upsellScore': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.upsellScore, op, val)
    }

    // ── CustomerMetrics: Verhalten ────────────────────────────────────────────
    case 'orderConsistencyScore': {
      if (!data.metrics || data.metrics.orderConsistencyScore === null) return false
      return numericMatch(data.metrics.orderConsistencyScore, op, val)
    }
    case 'orderDiversityScore': {
      if (!data.metrics) return false
      return numericMatch(data.metrics.orderDiversityScore, op, val)
    }
    case 'lunchRegularityPct': {
      if (!data.metrics || data.metrics.lunchRegularityPct === null) return false
      // Gespeichert 0.0–1.0, Regel-Wert 0–100
      return numericMatch(data.metrics.lunchRegularityPct * 100, op, val)
    }
    case 'avgLeadTimeHours': {
      if (!data.metrics || data.metrics.avgLeadTimeHours === null) return false
      return numericMatch(data.metrics.avgLeadTimeHours, op, val)
    }

    // ── CustomerMetrics: Engagement & Kanal ──────────────────────────────────
    case 'couponUsageRate': {
      if (!data.metrics) return false
      // Gespeichert 0.0–1.0, Regel-Wert 0–100
      return numericMatch(data.metrics.couponUsageRate * 100, op, val)
    }
    case 'walletUsageRate': {
      if (!data.metrics) return false
      // Gespeichert 0.0–1.0, Regel-Wert 0–100
      return numericMatch(data.metrics.walletUsageRate * 100, op, val)
    }
    case 'primaryChannel': {
      if (!data.metrics || data.metrics.primaryChannel === null) return false
      return enumMatch(data.metrics.primaryChannel, op, val)
    }
    case 'channelLoyaltyPct': {
      if (!data.metrics) return false
      // Gespeichert 0.0–1.0, Regel-Wert 0–100
      return numericMatch(data.metrics.channelLoyaltyPct * 100, op, val)
    }

    // ── CustomerPreference (Präferenzen & Allergene) ──────────────────────────
    default: {
      const attrDef = getAttributeByKey(rule.attribute)
      if (attrDef?.type === 'PREFERENCE' && attrDef.preferenceKey) {
        if (op === 'has_set') return data.preferenceKeys.has(attrDef.preferenceKey)
        if (op === 'has_not_set') return !data.preferenceKeys.has(attrDef.preferenceKey)
      }
      return false
    }
  }
}

function matchesRules(
  rules: SegmentRule[],
  combination: RulesCombination,
  data: UserAudienceData
): boolean {
  if (rules.length === 0) return false
  if (combination === 'AND') return rules.every((r) => matchRule(r, data))
  return rules.some((r) => matchRule(r, data))
}

/** Welche Regel-Indizes ein User erfüllt (für Preview). Bei AND: alle; bei OR: die erfüllten. */
function getMatchedRuleIndices(
  rules: SegmentRule[],
  combination: RulesCombination,
  data: UserAudienceData
): number[] {
  if (rules.length === 0) return []
  const indices: number[] = []
  rules.forEach((r, i) => {
    if (matchRule(r, data)) indices.push(i)
  })
  if (combination === 'AND') {
    if (indices.length !== rules.length) return []
    return indices
  }
  return indices.length > 0 ? indices : []
}

/** Lesbare Kurzbeschreibung einer Regel (z. B. "Kundenstufe gleich Gold"). */
export function ruleToLabel(rule: SegmentRule): string {
  const attrDef = getAttributeByKey(rule.attribute)
  // Fallback auf alte SEGMENT_ATTRIBUTES-Struktur für Kompatibilität
  const legacyAttr = !attrDef
    ? (SEGMENT_ATTRIBUTE_REGISTRY as unknown as { id?: string; label: string }[]).find(
        (a) => 'id' in a && a.id === rule.attribute
      )
    : null
  const attrLabel = attrDef?.label ?? legacyAttr?.label ?? rule.attribute

  if (rule.operator === 'has_set') return `${attrLabel} ist gesetzt`
  if (rule.operator === 'has_not_set') return `${attrLabel} ist nicht gesetzt`

  const op = getOperatorLabel(rule.operator)

  let valStr: string
  if (attrDef?.enumValues) {
    const vals = Array.isArray(rule.value) ? rule.value : [rule.value]
    valStr = vals
      .map((v) => attrDef.enumValues!.find((e) => String(e.value) === String(v))?.label ?? String(v))
      .join(', ')
  } else {
    valStr = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value ?? '')
  }

  const unit = attrDef?.unit ? ` ${attrDef.unit}` : ''
  return `${attrLabel} ${op} ${valStr}${unit}`
}

export type AudienceMemberWithRules = {
  userId: string
  matchedRuleIndices: number[]
}

/**
 * Berechnet die Zielgruppe inkl. welche Regeln pro User erfüllt sind (für Preview).
 */
export function computeSegmentAudienceWithRuleMatch(
  audienceData: UserAudienceData[],
  rules: unknown,
  rulesCombination: RulesCombination,
  limit?: number
): AudienceMemberWithRules[] {
  const ruleList = Array.isArray(rules) ? (rules as SegmentRule[]) : []
  if (ruleList.length === 0) return []
  const result: AudienceMemberWithRules[] = []
  for (const d of audienceData) {
    const indices = getMatchedRuleIndices(ruleList, rulesCombination, d)
    if (indices.length > 0) result.push({ userId: d.userId, matchedRuleIndices: indices })
    if (limit != null && limit > 0 && result.length >= limit) break
  }
  return result
}

function decimalToNumber(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'object' && 'toNumber' in (v as object)) return (v as Decimal).toNumber()
  return Number(v)
}

/**
 * Lädt alle Kunden-Daten für eine Organisation.
 * Inkludiert auch Nutzer ohne Bestellungen, damit Segmente wie „Rolle = CUSTOMER"
 * oder „Registriert in letzten X Tagen" funktionieren.
 * allowedLocationIds = null => alle Locations der Org (für order-basierte Metriken).
 */
export async function loadAudienceData(
  organizationId: string,
  allowedLocationIds: string[] | null
): Promise<UserAudienceData[]> {
  const locationWhere =
    allowedLocationIds && allowedLocationIds.length > 0
      ? { id: { in: allowedLocationIds }, organizationId }
      : { organizationId }

  const locationIds = (
    await prisma.location.findMany({
      where: locationWhere,
      select: { id: true },
    })
  ).map((l) => l.id)
  if (locationIds.length === 0) return []

  const orders = await prisma.order.findMany({
    where: { locationId: { in: locationIds } },
    select: {
      userId: true,
      totalAmount: true,
      createdAt: true,
      locationId: true,
    },
  })

  // Alle Nutzer der Organisation (inkl. ohne Bestellungen)
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      createdAt: true,
      role: true,
    },
  })
  if (users.length === 0) return []

  const userIds = users.map((u) => u.id)

  // Parallel: CompanyEmployees, CustomerMetrics, CustomerPreferences
  const [companyEmployees, allMetrics, allPrefs] = await Promise.all([
    prisma.companyEmployee.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { userId: true, companyId: true },
    }),
    prisma.customerMetrics.findMany({
      where: { organizationId },
      select: {
        userId: true,
        activityStatus: true,
        daysSinceLastOrder: true,
        daysSinceRegistration: true,
        preferredDayOfWeek: true,
        preferredTimeSlot: true,
        ltv: true,
        avgOrderValue: true,
        orderFrequencyPerWeek: true,
        spend30d: true,
        totalOrders: true,
        customerTier: true,
        rfmR: true,
        rfmF: true,
        rfmM: true,
        rfmSegment: true,
        frequencyTrend: true,
        spendTrend: true,
        orders30d: true,
        churnRiskScore: true,
        winBackScore: true,
        upsellScore: true,
        orderConsistencyScore: true,
        orderDiversityScore: true,
        lunchRegularityPct: true,
        avgLeadTimeHours: true,
        couponUsageRate: true,
        walletUsageRate: true,
        primaryChannel: true,
        channelLoyaltyPct: true,
      },
    }),
    prisma.customerPreference.findMany({
      where: {
        userId: { in: userIds },
        type: 'EXPLICIT',
        ignored: false,
      },
      select: { userId: true, key: true },
    }),
  ])

  // Indizes aufbauen
  const metricsByUser = new Map(allMetrics.map((m) => [m.userId, m]))

  const prefsByUser = new Map<string, Set<string>>()
  for (const p of allPrefs) {
    if (!prefsByUser.has(p.userId)) prefsByUser.set(p.userId, new Set())
    prefsByUser.get(p.userId)!.add(p.key)
  }

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  const orderStats = new Map<
    string,
    { count: number; lastDate: Date | null; total: number; locationIds: Set<string> }
  >()
  for (const o of orders) {
    let s = orderStats.get(o.userId)
    if (!s) {
      s = { count: 0, lastDate: null, total: 0, locationIds: new Set() }
      orderStats.set(o.userId, s)
    }
    s.count += 1
    s.total += decimalToNumber(o.totalAmount)
    if (!s.lastDate || o.createdAt > s.lastDate) s.lastDate = o.createdAt
    s.locationIds.add(o.locationId)
  }

  const companiesByUser = new Map<string, string[]>()
  for (const ce of companyEmployees) {
    const arr = companiesByUser.get(ce.userId) || []
    if (!arr.includes(ce.companyId)) arr.push(ce.companyId)
    companiesByUser.set(ce.userId, arr)
  }

  const result: UserAudienceData[] = []
  for (const u of users) {
    const stats = orderStats.get(u.id)
    const lastOrder = stats?.lastDate ?? null
    const lastOrderDays = lastOrder
      ? Math.floor((now.getTime() - lastOrder.getTime()) / oneDay)
      : null

    const raw = metricsByUser.get(u.id)
    const metrics: CustomerMetricsFields | null = raw
      ? {
          activityStatus: String(raw.activityStatus),
          daysSinceLastOrder: raw.daysSinceLastOrder ?? null,
          daysSinceRegistration: raw.daysSinceRegistration,
          preferredDayOfWeek: raw.preferredDayOfWeek ?? null,
          preferredTimeSlot: raw.preferredTimeSlot ?? null,
          ltv: decimalToNumber(raw.ltv),
          avgOrderValue: decimalToNumber(raw.avgOrderValue),
          orderFrequencyPerWeek: decimalToNumber(raw.orderFrequencyPerWeek),
          spend30d: decimalToNumber(raw.spend30d),
          totalOrders: raw.totalOrders,
          customerTier: String(raw.customerTier),
          rfmSegment: String(raw.rfmSegment),
          rfmR: raw.rfmR,
          rfmF: raw.rfmF,
          rfmM: raw.rfmM,
          frequencyTrend: String(raw.frequencyTrend),
          spendTrend: String(raw.spendTrend),
          orders30d: raw.orders30d,
          churnRiskScore: raw.churnRiskScore,
          winBackScore: raw.winBackScore ?? null,
          upsellScore: raw.upsellScore,
          orderConsistencyScore: raw.orderConsistencyScore ?? null,
          orderDiversityScore: raw.orderDiversityScore,
          lunchRegularityPct:
            raw.lunchRegularityPct !== null ? decimalToNumber(raw.lunchRegularityPct) : null,
          avgLeadTimeHours:
            raw.avgLeadTimeHours !== null ? decimalToNumber(raw.avgLeadTimeHours) : null,
          couponUsageRate: decimalToNumber(raw.couponUsageRate),
          walletUsageRate: decimalToNumber(raw.walletUsageRate),
          primaryChannel: raw.primaryChannel ?? null,
          channelLoyaltyPct: decimalToNumber(raw.channelLoyaltyPct),
        }
      : null

    result.push({
      userId: u.id,
      orderCount: stats?.count ?? 0,
      lastOrderDays,
      totalSpent: stats?.total ?? 0,
      locationIds: Array.from(stats?.locationIds ?? []),
      companyIds: companiesByUser.get(u.id) ?? [],
      registeredAt: u.createdAt,
      role: (u.role as string) || 'CUSTOMER',
      metrics,
      preferenceKeys: prefsByUser.get(u.id) ?? new Set(),
    })
  }
  return result
}

/**
 * Lädt Audience-Daten für einen einzelnen User (für `/api/admin/kunden/[id]/segmente`).
 */
export async function loadSingleUserAudienceData(
  userId: string,
  organizationId: string
): Promise<UserAudienceData | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, createdAt: true, role: true },
  })
  if (!user) return null

  const [orders, companyEmployees, rawMetrics, prefs] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: { totalAmount: true, createdAt: true, locationId: true },
    }),
    prisma.companyEmployee.findMany({
      where: { userId, isActive: true },
      select: { companyId: true },
    }),
    prisma.customerMetrics.findUnique({
      where: { userId },
      select: {
        activityStatus: true,
        daysSinceLastOrder: true,
        daysSinceRegistration: true,
        preferredDayOfWeek: true,
        preferredTimeSlot: true,
        ltv: true,
        avgOrderValue: true,
        orderFrequencyPerWeek: true,
        spend30d: true,
        totalOrders: true,
        customerTier: true,
        rfmR: true,
        rfmF: true,
        rfmM: true,
        rfmSegment: true,
        frequencyTrend: true,
        spendTrend: true,
        orders30d: true,
        churnRiskScore: true,
        winBackScore: true,
        upsellScore: true,
        orderConsistencyScore: true,
        orderDiversityScore: true,
        lunchRegularityPct: true,
        avgLeadTimeHours: true,
        couponUsageRate: true,
        walletUsageRate: true,
        primaryChannel: true,
        channelLoyaltyPct: true,
      },
    }),
    prisma.customerPreference.findMany({
      where: { userId, type: 'EXPLICIT', ignored: false },
      select: { key: true },
    }),
  ])

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  let orderCount = 0
  let totalSpent = 0
  let lastDate: Date | null = null
  const locationIdSet = new Set<string>()

  for (const o of orders) {
    orderCount++
    totalSpent += decimalToNumber(o.totalAmount)
    if (!lastDate || o.createdAt > lastDate) lastDate = o.createdAt
    locationIdSet.add(o.locationId)
  }

  const lastOrderDays = lastDate
    ? Math.floor((now.getTime() - lastDate.getTime()) / oneDay)
    : null

  const metrics: CustomerMetricsFields | null = rawMetrics
    ? {
        activityStatus: String(rawMetrics.activityStatus),
        daysSinceLastOrder: rawMetrics.daysSinceLastOrder ?? null,
        daysSinceRegistration: rawMetrics.daysSinceRegistration,
        preferredDayOfWeek: rawMetrics.preferredDayOfWeek ?? null,
        preferredTimeSlot: rawMetrics.preferredTimeSlot ?? null,
        ltv: decimalToNumber(rawMetrics.ltv),
        avgOrderValue: decimalToNumber(rawMetrics.avgOrderValue),
        orderFrequencyPerWeek: decimalToNumber(rawMetrics.orderFrequencyPerWeek),
        spend30d: decimalToNumber(rawMetrics.spend30d),
        totalOrders: rawMetrics.totalOrders,
        customerTier: String(rawMetrics.customerTier),
        rfmSegment: String(rawMetrics.rfmSegment),
        rfmR: rawMetrics.rfmR,
        rfmF: rawMetrics.rfmF,
        rfmM: rawMetrics.rfmM,
        frequencyTrend: String(rawMetrics.frequencyTrend),
        spendTrend: String(rawMetrics.spendTrend),
        orders30d: rawMetrics.orders30d,
        churnRiskScore: rawMetrics.churnRiskScore,
        winBackScore: rawMetrics.winBackScore ?? null,
        upsellScore: rawMetrics.upsellScore,
        orderConsistencyScore: rawMetrics.orderConsistencyScore ?? null,
        orderDiversityScore: rawMetrics.orderDiversityScore,
        lunchRegularityPct:
          rawMetrics.lunchRegularityPct !== null
            ? decimalToNumber(rawMetrics.lunchRegularityPct)
            : null,
        avgLeadTimeHours:
          rawMetrics.avgLeadTimeHours !== null
            ? decimalToNumber(rawMetrics.avgLeadTimeHours)
            : null,
        couponUsageRate: decimalToNumber(rawMetrics.couponUsageRate),
        walletUsageRate: decimalToNumber(rawMetrics.walletUsageRate),
        primaryChannel: rawMetrics.primaryChannel ?? null,
        channelLoyaltyPct: decimalToNumber(rawMetrics.channelLoyaltyPct),
      }
    : null

  return {
    userId: user.id,
    orderCount,
    lastOrderDays,
    totalSpent,
    locationIds: Array.from(locationIdSet),
    companyIds: companyEmployees.map((ce) => ce.companyId),
    registeredAt: user.createdAt,
    role: (user.role as string) || 'CUSTOMER',
    metrics,
    preferenceKeys: new Set(prefs.map((p) => p.key)),
  }
}

/**
 * Berechnet die Zielgruppe für ein Segment (Regeln + Kombination).
 * Gibt User-IDs zurück, die alle Regeln erfüllen.
 */
export function computeSegmentAudience(
  audienceData: UserAudienceData[],
  rules: unknown,
  rulesCombination: RulesCombination
): string[] {
  const ruleList = Array.isArray(rules) ? (rules as SegmentRule[]) : []
  if (ruleList.length === 0) return []
  return audienceData
    .filter((d) => matchesRules(ruleList, rulesCombination, d))
    .map((d) => d.userId)
}

/**
 * Wie computeSegmentAudience, aber mit optionalem Limit für Listen-Abruf.
 */
export function computeSegmentAudienceIds(
  audienceData: UserAudienceData[],
  rules: unknown,
  rulesCombination: RulesCombination,
  limit?: number
): string[] {
  const ids = computeSegmentAudience(audienceData, rules, rulesCombination)
  if (limit != null && limit > 0) return ids.slice(0, limit)
  return ids
}
