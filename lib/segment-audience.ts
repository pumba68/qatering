/**
 * PROJ-4: Berechnung der Segment-Zielgruppe (Audience) anhand von Regeln.
 * Regeln: [{ attribute, operator, value }], Kombination AND | OR.
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export type SegmentRule = {
  attribute: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: string | number | string[] | number[]
}

export type RulesInput = SegmentRule[]
export type RulesCombination = 'AND' | 'OR'

/** Unterstützte Attribute für Segment-Regeln */
export const SEGMENT_ATTRIBUTES = [
  { id: 'orderCount', label: 'Anzahl Bestellungen', valueType: 'number' as const },
  { id: 'lastOrderDays', label: 'Tage seit letzter Bestellung', valueType: 'number' as const },
  { id: 'totalSpent', label: 'Umsatz gesamt (€)', valueType: 'number' as const },
  { id: 'locationId', label: 'Standort', valueType: 'location' as const },
  { id: 'companyId', label: 'Unternehmen', valueType: 'company' as const },
  { id: 'registeredInLastDays', label: 'Registriert in den letzten X Tagen', valueType: 'number' as const },
  { id: 'role', label: 'Rolle', valueType: 'role' as const },
] as const

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
}

function toNumber(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') return parseFloat(v) || 0
  return 0
}

function matchRule(rule: SegmentRule, data: UserAudienceData): boolean {
  const op = rule.operator
  const val = rule.value

  switch (rule.attribute) {
    case 'orderCount': {
      const n = toNumber(val)
      const v = data.orderCount
      if (op === 'eq') return v === n
      if (op === 'ne') return v !== n
      if (op === 'gt') return v > n
      if (op === 'gte') return v >= n
      if (op === 'lt') return v < n
      if (op === 'lte') return v <= n
      if (op === 'in') return Array.isArray(val) && val.map(toNumber).includes(v)
      return false
    }
    case 'lastOrderDays': {
      const n = toNumber(val)
      const v = data.lastOrderDays
      if (v === null) {
        // Keine Bestellung → "sehr großer" Wert; nur "gt" / "gte" könnte matchen
        if (op === 'gt' || op === 'gte') return true
        if (op === 'eq' || op === 'lt' || op === 'lte') return false
        if (op === 'ne') return true
        return false
      }
      if (op === 'eq') return v === n
      if (op === 'ne') return v !== n
      if (op === 'gt') return v > n
      if (op === 'gte') return v >= n
      if (op === 'lt') return v < n
      if (op === 'lte') return v <= n
      if (op === 'in') return Array.isArray(val) && val.map(toNumber).includes(v)
      return false
    }
    case 'totalSpent': {
      const n = toNumber(val)
      const v = data.totalSpent
      if (op === 'eq') return Math.abs(v - n) < 0.01
      if (op === 'ne') return Math.abs(v - n) >= 0.01
      if (op === 'gt') return v > n
      if (op === 'gte') return v >= n
      if (op === 'lt') return v < n
      if (op === 'lte') return v <= n
      if (op === 'in') return Array.isArray(val) && val.map(toNumber).some((x) => Math.abs(v - x) < 0.01)
      return false
    }
    case 'locationId': {
      const id = typeof val === 'string' ? val : Array.isArray(val) ? val : String(val)
      const ids = Array.isArray(id) ? id.map(String) : [String(id)]
      if (op === 'eq' || op === 'in') return ids.some((x) => data.locationIds.includes(x))
      if (op === 'ne') return !ids.some((x) => data.locationIds.includes(x))
      return false
    }
    case 'companyId': {
      const id = typeof val === 'string' ? val : Array.isArray(val) ? val : String(val)
      const ids = Array.isArray(id) ? id.map(String) : [String(id)]
      if (op === 'eq' || op === 'in') return ids.some((x) => data.companyIds.includes(x))
      if (op === 'ne') return !ids.some((x) => data.companyIds.includes(x))
      return false
    }
    case 'registeredInLastDays': {
      const n = toNumber(val)
      const now = new Date()
      const daysSince = Math.floor((now.getTime() - data.registeredAt.getTime()) / (24 * 60 * 60 * 1000))
      // "Registriert in den letzten X Tagen" => daysSince <= n
      if (op === 'eq') return daysSince === n
      if (op === 'ne') return daysSince !== n
      if (op === 'lte') return daysSince <= n
      if (op === 'lt') return daysSince < n
      if (op === 'gte') return daysSince >= n
      if (op === 'gt') return daysSince > n
      if (op === 'in') return Array.isArray(val) && val.map(toNumber).includes(daysSince)
      return false
    }
    case 'role': {
      const r = typeof val === 'string' ? val : String(val)
      const userRole = data.role || 'CUSTOMER'
      if (op === 'eq') return userRole === r
      if (op === 'ne') return userRole !== r
      if (op === 'in') return Array.isArray(val) && val.map(String).includes(userRole)
      return false
    }
    default:
      return false
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

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: 'in',
}

/** Lesbare Kurzbeschreibung einer Regel (z. B. "Anzahl Bestellungen ≥ 5"). */
export function ruleToLabel(rule: SegmentRule): string {
  const att = SEGMENT_ATTRIBUTES.find((a) => a.id === rule.attribute)
  const attrLabel = att?.label ?? rule.attribute
  const op = OPERATOR_LABELS[rule.operator] ?? rule.operator
  const val = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)
  return `${attrLabel} ${op} ${val}`
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

/**
 * Lädt alle Kunden-Daten für eine Organisation (User mit Bestellungen an erlaubten Locations).
 * Optional: allowedLocationIds = null => alle Locations der Org.
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

  const userIds = Array.from(new Set(orders.map((o) => o.userId)))
  if (userIds.length === 0) return []

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      createdAt: true,
      role: true,
    },
  })

  const companyEmployees = await prisma.companyEmployee.findMany({
    where: { userId: { in: userIds }, isActive: true },
    select: { userId: true, companyId: true },
  })

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
    s.total += typeof o.totalAmount === 'object' && 'toNumber' in o.totalAmount
      ? (o.totalAmount as Decimal).toNumber()
      : Number(o.totalAmount)
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
    result.push({
      userId: u.id,
      orderCount: stats?.count ?? 0,
      lastOrderDays,
      totalSpent: stats?.total ?? 0,
      locationIds: Array.from(stats?.locationIds ?? []),
      companyIds: companiesByUser.get(u.id) ?? [],
      registeredAt: u.createdAt,
      role: (u.role as string) || 'CUSTOMER',
    })
  }
  return result
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
