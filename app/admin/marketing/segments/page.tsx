'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  getGroupedAttributes,
  getAttributeByKey,
  getOperatorLabel,
  getValueInputType,
  type AttributeDefinition,
  type SegmentOperator,
} from '@/lib/segment-attribute-registry'
import type { SegmentRule } from '@/lib/segment-audience'
import type { Segment, UserWithRules } from './SegmentsMainView.types'

type SelectOption = { value: string; label: string }

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const GROUPED_ATTRIBUTES = getGroupedAttributes()
const FIRST_ATTR_KEY = GROUPED_ATTRIBUTES[0]?.attributes[0]?.key ?? 'activityStatus'

function makeEmptyRule(): SegmentRule {
  const attrDef = getAttributeByKey(FIRST_ATTR_KEY)
  return {
    attribute: FIRST_ATTR_KEY,
    operator: (attrDef?.operators[0] ?? 'eq') as SegmentRule['operator'],
    value: null,
  }
}

// ─── Profil-konsistente Badges/Pills ──────────────────────────────────────────

function activityStatusConfig(status: string | null | undefined) {
  switch (status) {
    case 'AKTIV':        return { label: 'Aktiv',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'GELEGENTLICH': return { label: 'Gelegentlich', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
    case 'SCHLAFEND':    return { label: 'Schlafend',    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    case 'ABGEWANDERT':  return { label: 'Abgewandert',  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    case 'NEU':          return { label: 'Neu',          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    default:             return null
  }
}

function tierConfig(tier: string | null | undefined) {
  switch (tier) {
    case 'PLATIN':   return { label: 'Platin',   className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    case 'GOLD':     return { label: 'Gold',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'SILBER':   return { label: 'Silber',   className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    case 'BRONZE':   return { label: 'Bronze',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    case 'STANDARD': return { label: 'Standard', className: 'bg-muted text-muted-foreground' }
    default:         return null
  }
}

// ─── Rule Value Input ─────────────────────────────────────────────────────────

function RuleValueInput({
  rule,
  attrDef,
  companies,
  locations,
  onChange,
}: {
  rule: SegmentRule
  attrDef: AttributeDefinition | null
  companies: SelectOption[]
  locations: SelectOption[]
  onChange: (value: SegmentRule['value']) => void
}) {
  const inputType = getValueInputType(attrDef)
  const currentVal = rule.value

  if (inputType === 'none') {
    return <span className="text-xs text-muted-foreground italic pt-2">Kein Wert nötig</span>
  }

  if (inputType === 'enum-select') {
    const enumValues = attrDef?.enumValues ?? []
    const isMulti = rule.operator === 'in' || rule.operator === 'not_in'
    if (isMulti) {
      const selectedArr: string[] = Array.isArray(currentVal) ? currentVal.map(String) : (currentVal !== null && currentVal !== undefined ? [String(currentVal)] : [])
      const toggle = (v: string) => {
        const next = selectedArr.includes(v) ? selectedArr.filter((x) => x !== v) : [...selectedArr, v]
        onChange(next)
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {enumValues.map((ev) => {
            const selected = selectedArr.includes(String(ev.value))
            return (
              <button
                key={String(ev.value)}
                type="button"
                onClick={() => toggle(String(ev.value))}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:border-primary/50'}`}
              >
                {ev.label}
              </button>
            )
          })}
          {selectedArr.length === 0 && <span className="text-xs text-muted-foreground italic">Bitte Werte auswählen</span>}
        </div>
      )
    }
    const strVal = currentVal !== null && currentVal !== undefined ? String(currentVal) : String(enumValues[0]?.value ?? '')
    return (
      <select value={strVal} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {enumValues.map((ev) => (
          <option key={String(ev.value)} value={String(ev.value)}>{ev.label}</option>
        ))}
      </select>
    )
  }

  if (inputType === 'reference-select') {
    const options = attrDef?.key === 'companyId' ? companies : locations
    const isMulti = rule.operator === 'in' || rule.operator === 'not_in'
    if (isMulti) {
      const selectedArr: string[] = Array.isArray(currentVal) ? currentVal.map(String) : (currentVal !== null && currentVal !== undefined ? [String(currentVal)] : [])
      const toggle = (v: string) => {
        const next = selectedArr.includes(v) ? selectedArr.filter((x) => x !== v) : [...selectedArr, v]
        onChange(next)
      }
      if (options.length === 0) {
        return <span className="text-xs text-muted-foreground italic">Keine Einträge verfügbar</span>
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const selected = selectedArr.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:border-primary/50'}`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }
    if (options.length === 0) {
      return <span className="text-xs text-muted-foreground italic">Keine Einträge verfügbar</span>
    }
    const strVal = currentVal !== null && currentVal !== undefined ? String(currentVal) : ''
    return (
      <select value={strVal} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        <option value="">— wählen —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (inputType === 'stepper') {
    const { min, max, step } = attrDef!.discreteRange!
    const stepValues: number[] = []
    for (let v = min; v <= max; v += step) stepValues.push(v)
    const numVal = currentVal !== null && currentVal !== undefined ? Number(currentVal) : min
    return (
      <select value={String(numVal)} onChange={(e) => onChange(Number(e.target.value))} className={SELECT_CLASS}>
        {stepValues.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    )
  }

  // NUMERIC
  const numVal = currentVal !== null && currentVal !== undefined ? String(currentVal) : ''
  return (
    <div className="flex gap-1.5 items-center">
      <Input
        className="h-9 flex-1"
        type="number"
        value={numVal}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="Wert"
      />
      {attrDef?.unit && <span className="text-xs text-muted-foreground shrink-0">{attrDef.unit}</span>}
    </div>
  )
}

// ─── Rule Row ─────────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  index,
  companies,
  locations,
  onUpdate,
  onRemove,
}: {
  rule: SegmentRule
  index: number
  companies: SelectOption[]
  locations: SelectOption[]
  onUpdate: (patch: Partial<SegmentRule>) => void
  onRemove: () => void
}) {
  const attrDef = getAttributeByKey(rule.attribute)
  const allowedOps = attrDef?.operators ?? ['eq']
  const inputType = getValueInputType(attrDef)

  const handleAttributeChange = (newKey: string) => {
    const newAttr = getAttributeByKey(newKey)
    const newOps = newAttr?.operators ?? ['eq']
    const currentOpValid = newOps.includes(rule.operator as SegmentOperator)
    const nextOp = currentOpValid ? rule.operator : newOps[0]
    const nextVal = newAttr?.type === 'PREFERENCE' ? null :
      newAttr?.type === 'ENUM' ? (newAttr.enumValues?.[0]?.value ?? null) :
      newAttr?.type === 'REFERENCE' ? null :
      newAttr?.discreteRange ? newAttr.discreteRange.min :
      null
    onUpdate({ attribute: newKey, operator: nextOp as SegmentRule['operator'], value: nextVal })
  }

  const source = attrDef?.source
  const tooltipText =
    source === 'CUSTOMER_METRICS' ? 'Basiert auf täglich berechneten Merkmalen. Kunden ohne berechnete Merkmale werden ausgeschlossen.' :
    source === 'CUSTOMER_PREFERENCE' ? 'Wird live geprüft. Gilt nur für explizit hinterlegte oder bestätigte Präferenzen.' :
    null

  return (
    <Card className="p-3 rounded-xl border-border/50">
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr,auto] gap-2 items-start">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Attribut
              {tooltipText && (
                <span title={tooltipText} className="cursor-help">
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </span>
              )}
            </span>
            <select
              value={rule.attribute}
              onChange={(e) => handleAttributeChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {GROUPED_ATTRIBUTES.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.attributes.map((a) => (
                    <option key={a.key} value={a.key}>{a.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-5 shrink-0"
            onClick={onRemove}
            aria-label="Regel entfernen"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {inputType !== 'none' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Operator</span>
              <select
                value={rule.operator}
                onChange={(e) => onUpdate({ operator: e.target.value as SegmentRule['operator'] })}
                className={SELECT_CLASS}
              >
                {allowedOps.map((op) => (
                  <option key={op} value={op}>{getOperatorLabel(op)}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Wert</span>
              <RuleValueInput
                rule={rule}
                attrDef={attrDef}
                companies={companies}
                locations={locations}
                onChange={(val) => onUpdate({ value: val })}
              />
            </div>
          </div>
        )}

        {inputType === 'none' && (
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Operator</span>
            <select
              value={rule.operator}
              onChange={(e) => onUpdate({ operator: e.target.value as SegmentRule['operator'] })}
              className={SELECT_CLASS + ' max-w-48'}
            >
              {allowedOps.map((op) => (
                <option key={op} value={op}>{getOperatorLabel(op)}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    rulesCombination: 'AND' as 'AND' | 'OR',
    rules: [] as SegmentRule[],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [audienceLoading, setAudienceLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({})
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [audiencePreview, setAudiencePreview] = useState<{
    count: number
    ruleLabels: string[]
    usersWithRules: UserWithRules[]
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [companies, setCompanies] = useState<SelectOption[]>([])
  const [locations, setLocations] = useState<SelectOption[]>([])

  // Unternehmen und Standorte für REFERENCE-Dropdowns laden
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/companies').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/admin/locations').then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([cData, lData]) => {
      const cArr = Array.isArray(cData) ? cData : (cData?.companies ?? [])
      const lArr = Array.isArray(lData) ? lData : (lData?.locations ?? [])
      setCompanies(
        cArr.map((c: { id: string; name: string } | { value: string; label: string }) =>
          'value' in c ? c : { value: c.id, label: c.name }
        )
      )
      setLocations(
        lArr.map((l: { id: string; name: string } | { value: string; label: string }) =>
          'value' in l ? l : { value: l.id, label: l.name }
        )
      )
    })
  }, [])

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const res = await fetch('/api/admin/segments')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Segmente konnten nicht geladen werden.')
      setSegments(Array.isArray(data) ? data : [])
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Fehler')
      setSegments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])

  const refreshAllAudienceCounts = useCallback(async () => {
    if (segments.length === 0) return
    setLoadingCounts(true)
    const next: Record<string, number> = {}
    for (const seg of segments) {
      try {
        const res = await fetch(`/api/admin/segments/${seg.id}/audience?countOnly=true`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && typeof data.count === 'number') next[seg.id] = data.count
      } catch {
        // skip
      }
    }
    setAudienceCounts((prev) => ({ ...prev, ...next }))
    setLoadingCounts(false)
  }, [segments])

  useEffect(() => {
    if (segments.length > 0 && !loadingCounts) {
      refreshAllAudienceCounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length])

  const fetchAudience = useCallback(async (segmentId: string) => {
    setAudienceLoading(true)
    setAudienceCount(null)
    try {
      const res = await fetch(`/api/admin/segments/${segmentId}/audience?countOnly=true`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.count === 'number') setAudienceCount(data.count)
    } finally {
      setAudienceLoading(false)
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', description: '', rulesCombination: 'AND', rules: [] })
    setSaveError(null)
    setAudienceCount(null)
    setAudiencePreview(null)
    setSheetOpen(true)
  }

  const fetchAudiencePreview = useCallback(async (segmentId: string) => {
    setPreviewLoading(true)
    setAudiencePreview(null)
    try {
      const res = await fetch(
        `/api/admin/segments/${segmentId}/audience?showRuleMatch=true&includeMetrics=true&limit=5`
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.usersWithRules) {
        setAudiencePreview({
          count: data.count ?? 0,
          ruleLabels: data.ruleLabels ?? [],
          usersWithRules: data.usersWithRules,
        })
      }
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const openEdit = (seg: Segment) => {
    setEditingId(seg.id)
    setForm({
      name: seg.name,
      description: seg.description ?? '',
      rulesCombination: seg.rulesCombination === 'OR' ? 'OR' : 'AND',
      rules: Array.isArray(seg.rules) ? (seg.rules as SegmentRule[]) : [],
    })
    setSaveError(null)
    setAudienceCount(null)
    setAudiencePreview(null)
    setSheetOpen(true)
    if (seg.id) {
      fetchAudience(seg.id)
      fetchAudiencePreview(seg.id)
    }
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setEditingId(null)
    setDeleteConfirm(null)
  }

  const addRule = () => {
    setForm((f) => ({ ...f, rules: [...f.rules, makeEmptyRule()] }))
  }

  const updateRule = (index: number, patch: Partial<SegmentRule>) => {
    setForm((f) => ({
      ...f,
      rules: f.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }))
  }

  const removeRule = (index: number) => {
    setForm((f) => ({ ...f, rules: f.rules.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setSaveError('Name ist Pflichtfeld.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/segments/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: form.description.trim() || null,
            rulesCombination: form.rulesCombination,
            rules: form.rules,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.')
        await fetchSegments()
        setAudienceCount(null)
        fetchAudience(editingId)
      } else {
        const res = await fetch('/api/admin/segments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: form.description.trim() || null,
            rulesCombination: form.rulesCombination,
            rules: form.rules,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Anlegen fehlgeschlagen.')
        await fetchSegments()
        closeSheet()
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/segments/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen.')
      await fetchSegments()
      if (editingId === id) closeSheet()
      setDeleteConfirm(null)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Kundensegmente</h1>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Lade Segmente…</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Kundensegmente</h1>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <Button variant="outline" onClick={fetchSegments}>Erneut laden</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Kundensegmente</h1>
            <p className="text-muted-foreground mt-1">Zielgruppen für Kampagnen und Automation.</p>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2 shrink-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-[1.02] transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Neues Segment
          </Button>
        </div>
      </div>

      {segments.length === 0 ? (
        <Card className="rounded-2xl border-border/50 hover:shadow-2xl transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">Noch keine Segmente.</p>
            <p className="text-sm text-muted-foreground mb-4">Erstellen Sie Ihre erste Zielgruppe.</p>
            <Button
              onClick={openCreate}
              className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Neues Segment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => (
            <Card
              key={seg.id}
              className="rounded-2xl border border-border/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{seg.name}</CardTitle>
                <CardDescription className="line-clamp-2">{seg.description || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {audienceCounts[seg.id] !== undefined
                      ? `${audienceCounts[seg.id]} Kunden`
                      : '— Kunden'}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {Array.isArray(seg.rules) && seg.rules.length > 0
                      ? `${seg.rules.length} Regel(n)`
                      : '0 Regeln'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(seg)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      openEdit(seg)
                      setDeleteConfirm(seg.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Segment bearbeiten' : 'Neues Segment'}</SheetTitle>
            <SheetDescription>
              {editingId
                ? 'Name, Beschreibung und Regeln anpassen.'
                : 'Zielgruppe anlegen und Regeln definieren.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6 space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="seg-name">Name *</Label>
              <Input
                id="seg-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Stammkunden"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seg-desc">Beschreibung</Label>
              <Input
                id="seg-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Kombination der Regeln</Label>
              <select
                value={form.rulesCombination}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rulesCombination: e.target.value as 'AND' | 'OR',
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="AND">Alle Regeln (UND)</option>
                <option value="OR">Mindestens eine Regel (ODER)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Zielgruppen-Regeln</Label>
              {form.rules.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Regeln. Füge eine Regel hinzu.</p>
              )}
              {form.rules.map((rule, idx) => (
                <RuleRow
                  key={idx}
                  rule={rule}
                  index={idx}
                  companies={companies}
                  locations={locations}
                  onUpdate={(patch) => updateRule(idx, patch)}
                  onRemove={() => removeRule(idx)}
                />
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addRule}>
                <Plus className="h-3.5 w-3.5" />
                Regel hinzufügen
              </Button>
            </div>

            {editingId && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Zielgruppengröße:</Label>
                  {audienceLoading ? (
                    <span className="text-sm text-muted-foreground">Berechnung…</span>
                  ) : audienceCount !== null ? (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      {audienceCount} Kunden
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAudience(editingId)}
                      disabled={audienceLoading}
                    >
                      Berechnen
                    </Button>
                  )}
                </div>
                <div className="space-y-2 border-t pt-4">
                  <Label>Kunden-Vorschau (erste 5)</Label>
                  <p className="text-xs text-muted-foreground">
                    Kunden im Segment mit Profil-Merkmalen.
                  </p>
                  {previewLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Lade Vorschau…
                    </div>
                  ) : audiencePreview ? (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      {audiencePreview.usersWithRules.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Keine Kunden im Segment (oder keine Regeln definiert).
                        </p>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {audiencePreview.usersWithRules.map((u) => {
                            const statusCfg = activityStatusConfig(u.activityStatus)
                            const tierCfg = tierConfig(u.customerTier)
                            return (
                              <div key={u.id} className="p-3 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {u.name || u.email || u.id}
                                  </span>
                                  {statusCfg && (
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
                                    >
                                      {statusCfg.label}
                                    </span>
                                  )}
                                  {tierCfg && (
                                    <Badge className={`text-xs ${tierCfg.className}`}>
                                      {tierCfg.label}
                                    </Badge>
                                  )}
                                  {u.ltv !== null && u.ltv !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      LTV: {u.ltv.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                  )}
                                  {u.activityStatus === null || u.activityStatus === undefined ? (
                                    <span className="text-xs text-muted-foreground italic">Keine Merkmale berechnet</span>
                                  ) : null}
                                </div>
                                {u.name && u.email && (
                                  <div className="text-xs text-muted-foreground">{u.email}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {audiencePreview.count > audiencePreview.usersWithRules.length && (
                        <p className="p-2 text-xs text-muted-foreground border-t border-border/50">
                          Weitere{' '}
                          {audiencePreview.count - audiencePreview.usersWithRules.length} Kunden im
                          Segment.
                        </p>
                      )}
                    </div>
                  ) : editingId && !previewLoading && !audiencePreview ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAudiencePreview(editingId)}
                    >
                      Vorschau laden
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {deleteConfirm === editingId && editingId && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                <p className="text-sm">
                  Segment wirklich löschen? Workflows/In-App-Nachrichten, die dieses Segment
                  nutzen, müssen zuvor angepasst werden.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(editingId)}
                  >
                    Löschen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={closeSheet} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
