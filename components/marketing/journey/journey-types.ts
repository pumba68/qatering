// ─── Node Types ───────────────────────────────────────────────────────────────

export type JourneyNodeType =
  | 'start'
  | 'delay'
  | 'email'
  | 'inapp'
  | 'push'
  | 'branch'
  | 'incentive'
  | 'end'

// ─── Node Configs ─────────────────────────────────────────────────────────────

export interface StartNodeConfig {
  triggerType: 'EVENT' | 'SEGMENT_ENTRY' | 'DATE_BASED'
  eventType?: string
  segmentId?: string
  dateField?: string
  daysBefore?: number
}

export interface DelayNodeConfig {
  amount: number
  unit: 'minutes' | 'hours' | 'days'
  waitUntil?: {
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
    hour: number
  }
}

export interface EmailNodeConfig {
  templateId: string
  templateName?: string
  subjectOverride?: string
  senderNameOverride?: string
  onFailure: 'stop' | 'continue'
}

export interface InAppNodeConfig {
  templateId: string
  templateName?: string
  onFailure: 'stop' | 'continue'
}

export interface PushNodeConfig {
  templateId: string
  templateName?: string
  onFailure: 'stop' | 'continue'
}

export interface BranchNodeConfig {
  conditionType: 'attribute' | 'event' | 'segment' | 'email_opened'
  field?: string
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in'
  value?: string | number | string[]
  eventType?: string
  windowDays?: number
  segmentId?: string
  segmentName?: string
}

export interface IncentiveNodeConfig {
  incentiveType: 'coupon' | 'wallet_credit'
  couponId?: string
  couponName?: string
  walletAmount?: number
  walletNote?: string
}

export interface EndNodeConfig {
  label?: string
}

export type NodeConfig =
  | StartNodeConfig
  | DelayNodeConfig
  | EmailNodeConfig
  | InAppNodeConfig
  | PushNodeConfig
  | BranchNodeConfig
  | IncentiveNodeConfig
  | EndNodeConfig

// ─── Canvas Node / Edge ───────────────────────────────────────────────────────

export interface CanvasNode {
  id: string
  type: JourneyNodeType
  position: { x: number; y: number }
  config: NodeConfig
  label?: string
}

export interface CanvasEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle?: string
}

export interface CanvasContent {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// ─── Journey ──────────────────────────────────────────────────────────────────

export type JourneyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type JourneyTriggerType = 'EVENT' | 'SEGMENT_ENTRY' | 'DATE_BASED'
export type JourneyParticipantStatus =
  | 'ACTIVE'
  | 'CONVERTED'
  | 'EXITED'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED'

export interface Journey {
  id: string
  name: string
  description?: string | null
  status: JourneyStatus
  triggerType: JourneyTriggerType
  triggerConfig: Record<string, unknown>
  content: CanvasContent
  startDate?: string | null
  endDate?: string | null
  reEntryPolicy: string
  conversionGoal?: Record<string, unknown> | null
  exitRules?: Record<string, unknown>[] | null
  createdAt: string
  updatedAt: string
  // computed
  activeParticipants?: number
  totalParticipants?: number
  conversionRate?: number
}

// ─── Node Palette Config ──────────────────────────────────────────────────────

export interface PaletteItem {
  type: JourneyNodeType
  label: string
  description: string
  group: 'entry' | 'actions' | 'logic' | 'end'
  color: string
}

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'start',
    label: 'Einstieg',
    description: 'Trigger, der Nutzer in die Journey bringt',
    group: 'entry',
    color: '#7c3aed',
  },
  {
    type: 'email',
    label: 'E-Mail senden',
    description: 'E-Mail-Template an Nutzer senden',
    group: 'actions',
    color: '#2563eb',
  },
  {
    type: 'inapp',
    label: 'In-App Nachricht',
    description: 'In-App Banner oder Nachricht anzeigen',
    group: 'actions',
    color: '#7c3aed',
  },
  {
    type: 'push',
    label: 'Push Notification',
    description: 'Push-Benachrichtigung senden',
    group: 'actions',
    color: '#16a34a',
  },
  {
    type: 'incentive',
    label: 'Incentive vergeben',
    description: 'Coupon oder Wallet-Guthaben gutschreiben',
    group: 'actions',
    color: '#ea580c',
  },
  {
    type: 'delay',
    label: 'Warten',
    description: 'Pause einlegen (Minuten, Stunden, Tage)',
    group: 'logic',
    color: '#4b5563',
  },
  {
    type: 'branch',
    label: 'Bedingung',
    description: 'Ja/Nein-Aufspaltung basierend auf einer Bedingung',
    group: 'logic',
    color: '#ca8a04',
  },
  {
    type: 'end',
    label: 'Ende',
    description: 'Journey-Endpunkt',
    group: 'end',
    color: '#374151',
  },
]

export const PALETTE_GROUPS = [
  { key: 'entry', label: 'Einstieg' },
  { key: 'actions', label: 'Aktionen' },
  { key: 'logic', label: 'Logik' },
  { key: 'end', label: 'Ende' },
] as const

// ─── Status Config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<JourneyStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Pausiert', color: 'bg-yellow-100 text-yellow-700' },
  ARCHIVED: { label: 'Archiviert', color: 'bg-red-100 text-red-700' },
}

export const TRIGGER_LABELS: Record<JourneyTriggerType, string> = {
  EVENT: 'Event-basiert',
  SEGMENT_ENTRY: 'Segment-Eintritt',
  DATE_BASED: 'Datum-basiert',
}

export const EVENT_TYPES = [
  { value: 'user.registered', label: 'Registrierung / Neuanmeldung' },
  { value: 'order.first', label: 'Erste Bestellung' },
  { value: 'user.inactive', label: 'Inaktivität (keine Bestellung)' },
  { value: 'wallet.below_threshold', label: 'Guthabenstand unter Schwellwert' },
]

export const DEFAULT_NODE_CONFIGS: Record<JourneyNodeType, NodeConfig> = {
  start: {
    triggerType: 'EVENT',
    eventType: 'user.registered',
  } as StartNodeConfig,
  delay: {
    amount: 1,
    unit: 'days',
  } as DelayNodeConfig,
  email: {
    templateId: '',
    onFailure: 'continue',
  } as EmailNodeConfig,
  inapp: {
    templateId: '',
    onFailure: 'continue',
  } as InAppNodeConfig,
  push: {
    templateId: '',
    onFailure: 'continue',
  } as PushNodeConfig,
  branch: {
    conditionType: 'event',
    eventType: 'order.first',
    windowDays: 7,
  } as BranchNodeConfig,
  incentive: {
    incentiveType: 'wallet_credit',
    walletAmount: 5,
  } as IncentiveNodeConfig,
  end: {} as EndNodeConfig,
}
