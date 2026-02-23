import type { SegmentRule } from '@/lib/segment-audience'

export type Segment = {
  id: string
  name: string
  description: string | null
  rulesCombination: string
  rules: SegmentRule[]
  _count?: { inAppMessages: number; workflows: number }
}

export type UserWithRules = {
  id: string
  email: string | null
  name: string | null
  matchedRuleLabels: string[]
  activityStatus?: string | null
  customerTier?: string | null
  ltv?: number | null
}

export interface SegmentsMainViewProps {
  segments: Segment[]
  audienceCounts: Record<string, number>
  sheetOpen: boolean
  editingId: string | null
  form: { name: string; description: string; rulesCombination: 'AND' | 'OR'; rules: SegmentRule[] }
  audienceCount: number | null
  audienceLoading: boolean
  audiencePreview: { count: number; ruleLabels: string[]; usersWithRules: UserWithRules[] } | null
  previewLoading: boolean
  saveError: string | null
  deleteConfirm: string | null
  saving: boolean
  onOpenCreate: () => void
  onOpenEdit: (seg: Segment) => void
  onCloseSheet: () => void
  onAddRule: () => void
  onUpdateRule: (index: number, patch: Partial<SegmentRule>) => void
  onRemoveRule: (index: number) => void
  onFetchAudience: (id: string) => void
  onFetchAudiencePreview: (id: string) => void
  onSave: () => void
  onDelete: (id: string) => void
  onSetDeleteConfirm: (id: string | null) => void
  onFormChange: (patch: Partial<{ name: string; description: string; rulesCombination: 'AND' | 'OR'; rules: SegmentRule[] }>) => void
}
