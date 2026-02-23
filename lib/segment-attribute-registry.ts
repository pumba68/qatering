/**
 * PROJ-22: Zentrale Attribut-Registry für Kundensegmentierung.
 * Single Source of Truth für Labels, Gruppen, Typen und Operatoren.
 */

export type AttributeType = 'ENUM' | 'NUMERIC' | 'PREFERENCE' | 'REFERENCE'
export type AttributeSource = 'CUSTOMER_METRICS' | 'CUSTOMER_PREFERENCE' | 'USER'
export type SegmentOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'has_set'
  | 'has_not_set'

export type AttributeDefinition = {
  key: string
  label: string
  group: string
  type: AttributeType
  source: AttributeSource
  operators: SegmentOperator[]
  unit?: string
  enumValues?: { value: string | number; label: string }[]
  loadOptionsFrom?: string
  discreteRange?: { min: number; max: number; step: number }
  preferenceKey?: string
}

// ─── Enum-Werte (aus Prisma-Schema) ──────────────────────────────────────────

const ACTIVITY_STATUS_VALUES = [
  { value: 'NEU', label: 'Neu' },
  { value: 'AKTIV', label: 'Aktiv' },
  { value: 'GELEGENTLICH', label: 'Gelegentlich' },
  { value: 'SCHLAFEND', label: 'Schlafend' },
  { value: 'ABGEWANDERT', label: 'Abgewandert' },
]

const CUSTOMER_TIER_VALUES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'BRONZE', label: 'Bronze' },
  { value: 'SILBER', label: 'Silber' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'PLATIN', label: 'Platin' },
]

const RFM_SEGMENT_VALUES = [
  { value: 'NEW_CUSTOMER', label: 'Neukunde' },
  { value: 'CHAMPION', label: 'Champion' },
  { value: 'LOYAL', label: 'Loyal' },
  { value: 'POTENTIAL', label: 'Potenzial' },
  { value: 'NEEDS_ATTENTION', label: 'Braucht Aufmerksamkeit' },
  { value: 'AT_RISK', label: 'Risikokunde' },
  { value: 'CANT_LOSE', label: 'Nicht verlieren' },
  { value: 'HIBERNATING', label: 'Inaktiv' },
]

const TREND_DIRECTION_VALUES = [
  { value: 'WACHSEND', label: 'Wachsend' },
  { value: 'STABIL', label: 'Stabil' },
  { value: 'RUECKLAEUFIG', label: 'Rückläufig' },
]

const PREFERRED_DAY_OF_WEEK_VALUES = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 0, label: 'Sonntag' },
]

const PREFERRED_TIME_SLOT_VALUES = [
  { value: 'BREAKFAST', label: 'Frühstück' },
  { value: 'LUNCH', label: 'Mittag' },
  { value: 'AFTERNOON', label: 'Nachmittag' },
  { value: 'EVENING', label: 'Abend' },
]

const PRIMARY_CHANNEL_VALUES = [
  { value: 'APP', label: 'App' },
  { value: 'WEB', label: 'Web' },
  { value: 'TERMINAL', label: 'Terminal' },
  { value: 'KASSE', label: 'Kasse' },
  { value: 'ADMIN', label: 'Admin' },
]

const USER_ROLE_VALUES = [
  { value: 'CUSTOMER', label: 'Kunde' },
  { value: 'KITCHEN_STAFF', label: 'Küchenpersonal' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

// ─── Operator-Gruppen ─────────────────────────────────────────────────────────

const ENUM_OPS: SegmentOperator[] = ['eq', 'in', 'not_in']
const NUMERIC_OPS: SegmentOperator[] = ['eq', 'gt', 'gte', 'lt', 'lte']
const NUMERIC_RANGE_OPS: SegmentOperator[] = ['gt', 'gte', 'lt', 'lte']
const PREFERENCE_OPS: SegmentOperator[] = ['has_set', 'has_not_set']
const REFERENCE_OPS: SegmentOperator[] = ['eq', 'in', 'not_in']

// ─── Haupt-Registry ───────────────────────────────────────────────────────────

export const SEGMENT_ATTRIBUTE_REGISTRY: AttributeDefinition[] = [
  // ── Gruppe 1: Aktivität & Status ────────────────────────────────────────────
  {
    key: 'activityStatus',
    label: 'Aktivitätsstatus',
    group: 'Aktivität & Status',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ENUM_OPS,
    enumValues: ACTIVITY_STATUS_VALUES,
  },
  {
    key: 'daysSinceLastOrder',
    label: 'Tage seit letzter Bestellung',
    group: 'Aktivität & Status',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    unit: 'Tage',
  },
  {
    key: 'daysSinceRegistration',
    label: 'Tage seit Registrierung',
    group: 'Aktivität & Status',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    unit: 'Tage',
  },
  {
    key: 'preferredDayOfWeek',
    label: 'Bevorzugter Bestelltag',
    group: 'Aktivität & Status',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ['eq', 'in'],
    enumValues: PREFERRED_DAY_OF_WEEK_VALUES,
  },
  {
    key: 'preferredTimeSlot',
    label: 'Bevorzugter Zeitslot',
    group: 'Aktivität & Status',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ['eq', 'in'],
    enumValues: PREFERRED_TIME_SLOT_VALUES,
  },

  // ── Gruppe 2: Kundenwert & Metriken ─────────────────────────────────────────
  {
    key: 'ltv',
    label: 'Lifetime Value (LTV)',
    group: 'Kundenwert & Metriken',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    unit: '€',
  },
  {
    key: 'avgOrderValue',
    label: 'Ø Warenkorbwert',
    group: 'Kundenwert & Metriken',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    unit: '€',
  },
  {
    key: 'orderFrequencyPerWeek',
    label: 'Bestellfrequenz / Woche',
    group: 'Kundenwert & Metriken',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
  },
  {
    key: 'spend30d',
    label: 'Ausgaben letzte 30 Tage',
    group: 'Kundenwert & Metriken',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '€',
  },
  {
    key: 'totalOrders',
    label: 'Gesamtbestellungen',
    group: 'Kundenwert & Metriken',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
  },
  {
    key: 'customerTier',
    label: 'Kundenstufe',
    group: 'Kundenwert & Metriken',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ENUM_OPS,
    enumValues: CUSTOMER_TIER_VALUES,
  },

  // ── Gruppe 3: RFM-Profil ─────────────────────────────────────────────────────
  {
    key: 'rfmSegment',
    label: 'RFM-Segment',
    group: 'RFM-Profil',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ENUM_OPS,
    enumValues: RFM_SEGMENT_VALUES,
  },
  {
    key: 'rfmR',
    label: 'RFM Recency-Score',
    group: 'RFM-Profil',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    discreteRange: { min: 1, max: 5, step: 1 },
  },
  {
    key: 'rfmF',
    label: 'RFM Frequency-Score',
    group: 'RFM-Profil',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    discreteRange: { min: 1, max: 5, step: 1 },
  },
  {
    key: 'rfmM',
    label: 'RFM Monetary-Score',
    group: 'RFM-Profil',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
    discreteRange: { min: 1, max: 5, step: 1 },
  },

  // ── Gruppe 4: Trends ─────────────────────────────────────────────────────────
  {
    key: 'frequencyTrend',
    label: 'Bestellfrequenz-Trend',
    group: 'Trends',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ['eq', 'in'],
    enumValues: TREND_DIRECTION_VALUES,
  },
  {
    key: 'spendTrend',
    label: 'Ausgaben-Trend',
    group: 'Trends',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ['eq', 'in'],
    enumValues: TREND_DIRECTION_VALUES,
  },
  {
    key: 'orders30d',
    label: 'Bestellungen letzte 30 Tage',
    group: 'Trends',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_OPS,
  },

  // ── Gruppe 5: Risiko & Potenzial ─────────────────────────────────────────────
  {
    key: 'churnRiskScore',
    label: 'Churn-Risk-Score',
    group: 'Risiko & Potenzial',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '(0–100)',
  },
  {
    key: 'winBackScore',
    label: 'Win-Back-Score',
    group: 'Risiko & Potenzial',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '(0–100)',
  },
  {
    key: 'upsellScore',
    label: 'Upsell-Score',
    group: 'Risiko & Potenzial',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '(0–100)',
  },

  // ── Gruppe 6: Verhalten ──────────────────────────────────────────────────────
  {
    key: 'orderConsistencyScore',
    label: 'Konsistenz-Score',
    group: 'Verhalten',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '(0–100)',
  },
  {
    key: 'orderDiversityScore',
    label: 'Diversitäts-Score',
    group: 'Verhalten',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '(0–100)',
  },
  {
    key: 'lunchRegularityPct',
    label: 'Mittagsfrequenz',
    group: 'Verhalten',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '%',
    // Gespeichert als 0.0–1.0; Regeln und UI verwenden 0–100
  },
  {
    key: 'avgLeadTimeHours',
    label: 'Ø Vorlaufzeit',
    group: 'Verhalten',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: 'Std.',
  },

  // ── Gruppe 7: Engagement & Kanal ─────────────────────────────────────────────
  {
    key: 'couponUsageRate',
    label: 'Coupon-Nutzungsrate',
    group: 'Engagement & Kanal',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '%',
    // Gespeichert als 0.0–1.0; Regeln und UI verwenden 0–100
  },
  {
    key: 'walletUsageRate',
    label: 'Wallet-Nutzungsrate',
    group: 'Engagement & Kanal',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '%',
    // Gespeichert als 0.0–1.0; Regeln und UI verwenden 0–100
  },
  {
    key: 'primaryChannel',
    label: 'Primärer Kanal',
    group: 'Engagement & Kanal',
    type: 'ENUM',
    source: 'CUSTOMER_METRICS',
    operators: ['eq', 'in'],
    enumValues: PRIMARY_CHANNEL_VALUES,
  },
  {
    key: 'channelLoyaltyPct',
    label: 'Kanal-Loyalität',
    group: 'Engagement & Kanal',
    type: 'NUMERIC',
    source: 'CUSTOMER_METRICS',
    operators: NUMERIC_RANGE_OPS,
    unit: '%',
    // Gespeichert als 0.0–1.0; Regeln und UI verwenden 0–100
  },

  // ── Gruppe 8: Präferenzen & Allergene ────────────────────────────────────────
  // 14 EU-Pflichtallergene
  {
    key: 'pref_allergen_gluten',
    label: 'Allergen: Gluten',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_GLUTEN',
  },
  {
    key: 'pref_allergen_krebstiere',
    label: 'Allergen: Krebstiere',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_KREBSTIERE',
  },
  {
    key: 'pref_allergen_eier',
    label: 'Allergen: Eier',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_EIER',
  },
  {
    key: 'pref_allergen_fisch',
    label: 'Allergen: Fisch',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_FISCH',
  },
  {
    key: 'pref_allergen_erdnuesse',
    label: 'Allergen: Erdnüsse',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_ERDNUESSE',
  },
  {
    key: 'pref_allergen_soja',
    label: 'Allergen: Soja',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_SOJA',
  },
  {
    key: 'pref_allergen_milch',
    label: 'Allergen: Milch / Laktose',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_MILCH',
  },
  {
    key: 'pref_allergen_nuesse',
    label: 'Allergen: Schalenfrüchte / Nüsse',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_NUESSE',
  },
  {
    key: 'pref_allergen_sellerie',
    label: 'Allergen: Sellerie',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_SELLERIE',
  },
  {
    key: 'pref_allergen_senf',
    label: 'Allergen: Senf',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_SENF',
  },
  {
    key: 'pref_allergen_sesam',
    label: 'Allergen: Sesam',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_SESAM',
  },
  {
    key: 'pref_allergen_sulfite',
    label: 'Allergen: Schwefeldioxid / Sulfite',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_SULFITE',
  },
  {
    key: 'pref_allergen_lupinen',
    label: 'Allergen: Lupinen',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_LUPINEN',
  },
  {
    key: 'pref_allergen_weichtiere',
    label: 'Allergen: Weichtiere',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'ALLERGEN_WEICHTIERE',
  },
  // Diätkategorien
  {
    key: 'pref_diet_vegan',
    label: 'Ernährungsweise: Vegan',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_VEGAN',
  },
  {
    key: 'pref_diet_vegetarisch',
    label: 'Ernährungsweise: Vegetarisch',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_VEGETARISCH',
  },
  {
    key: 'pref_diet_halal',
    label: 'Ernährungsweise: Halal',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_HALAL',
  },
  {
    key: 'pref_diet_koscher',
    label: 'Ernährungsweise: Koscher',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_KOSCHER',
  },
  {
    key: 'pref_diet_glutenfrei',
    label: 'Ernährungsweise: Glutenfrei',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_GLUTENFREI',
  },
  {
    key: 'pref_diet_laktosefrei',
    label: 'Ernährungsweise: Laktosefrei',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_LAKTOSEFREI',
  },
  {
    key: 'pref_diet_low_carb',
    label: 'Ernährungsweise: Low Carb',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_LOW_CARB',
  },
  {
    key: 'pref_diet_diabetiker',
    label: 'Ernährungsweise: Diabetiker',
    group: 'Präferenzen & Allergene',
    type: 'PREFERENCE',
    source: 'CUSTOMER_PREFERENCE',
    operators: PREFERENCE_OPS,
    preferenceKey: 'DIET_DIABETIKER',
  },

  // ── Gruppe 9: Stammdaten ─────────────────────────────────────────────────────
  {
    key: 'orderCount',
    label: 'Anzahl Bestellungen',
    group: 'Stammdaten',
    type: 'NUMERIC',
    source: 'USER',
    operators: NUMERIC_OPS,
  },
  {
    key: 'lastOrderDays',
    label: 'Tage seit letzter Bestellung',
    group: 'Stammdaten',
    type: 'NUMERIC',
    source: 'USER',
    operators: NUMERIC_OPS,
    unit: 'Tage',
  },
  {
    key: 'totalSpent',
    label: 'Umsatz gesamt',
    group: 'Stammdaten',
    type: 'NUMERIC',
    source: 'USER',
    operators: NUMERIC_OPS,
    unit: '€',
  },
  {
    key: 'locationId',
    label: 'Standort',
    group: 'Stammdaten',
    type: 'REFERENCE',
    source: 'USER',
    operators: ['eq', 'in'],
    loadOptionsFrom: '/api/admin/locations',
  },
  {
    key: 'companyId',
    label: 'Unternehmen',
    group: 'Stammdaten',
    type: 'REFERENCE',
    source: 'USER',
    operators: REFERENCE_OPS,
    loadOptionsFrom: '/api/admin/companies',
  },
  {
    key: 'registeredInLastDays',
    label: 'Registriert in den letzten X Tagen',
    group: 'Stammdaten',
    type: 'NUMERIC',
    source: 'USER',
    operators: NUMERIC_OPS,
    unit: 'Tage',
  },
  {
    key: 'role',
    label: 'Rolle',
    group: 'Stammdaten',
    type: 'ENUM',
    source: 'USER',
    operators: ['eq', 'in'],
    enumValues: USER_ROLE_VALUES,
  },
]

// ─── Helper-Funktionen ────────────────────────────────────────────────────────

/** Attribut anhand des Keys finden. */
export function getAttributeByKey(key: string): AttributeDefinition | null {
  return SEGMENT_ATTRIBUTE_REGISTRY.find((a) => a.key === key) ?? null
}

/** Gibt die Registry nach Gruppen gegliedert zurück (für <optgroup>-Rendering). */
export function getGroupedAttributes(): { label: string; attributes: AttributeDefinition[] }[] {
  const groups = new Map<string, AttributeDefinition[]>()
  for (const attr of SEGMENT_ATTRIBUTE_REGISTRY) {
    if (!groups.has(attr.group)) groups.set(attr.group, [])
    groups.get(attr.group)!.push(attr)
  }
  return Array.from(groups.entries()).map(([label, attributes]) => ({ label, attributes }))
}

/** Menschenlesbare Bezeichnung für einen Operator. */
export function getOperatorLabel(op: SegmentOperator): string {
  const labels: Record<SegmentOperator, string> = {
    eq: 'gleich',
    ne: 'ungleich',
    gt: 'größer als',
    gte: 'größer oder gleich',
    lt: 'kleiner als',
    lte: 'kleiner oder gleich',
    in: 'in Liste',
    not_in: 'nicht in Liste',
    has_set: 'ist gesetzt',
    has_not_set: 'ist nicht gesetzt',
  }
  return labels[op] ?? op
}

/** Welches Wert-Eingabe-Element soll im UI gerendert werden? */
export function getValueInputType(
  attr: AttributeDefinition | null | undefined
): 'enum-select' | 'reference-select' | 'number' | 'stepper' | 'none' {
  if (!attr) return 'number'
  if (attr.type === 'PREFERENCE') return 'none'
  if (attr.type === 'ENUM') return 'enum-select'
  if (attr.type === 'REFERENCE') return 'reference-select'
  if (attr.type === 'NUMERIC' && attr.discreteRange) return 'stepper'
  return 'number'
}

/** Label für einen Enum-Wert aus der Registry. */
export function getLabelForEnumValue(key: string, value: string | number): string {
  const attr = getAttributeByKey(key)
  if (!attr || !attr.enumValues) return String(value)
  return attr.enumValues.find((e) => String(e.value) === String(value))?.label ?? String(value)
}

// ─── % Felder (gespeichert als 0.0–1.0, UI und Regeln als 0–100) ─────────────
export const PERCENT_FIELD_KEYS = new Set([
  'lunchRegularityPct',
  'couponUsageRate',
  'walletUsageRate',
  'channelLoyaltyPct',
])
