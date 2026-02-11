'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SEGMENT_ATTRIBUTES } from '@/lib/segment-audience'
import type { SegmentRule } from '@/lib/segment-audience'

type Segment = {
  id: string
  name: string
  description: string | null
  rulesCombination: string
  rules: SegmentRule[]
  _count?: { inAppMessages: number; workflows: number }
}

type UserWithRules = {
  id: string
  email: string | null
  name: string | null
  matchedRuleLabels: string[]
}

const operators = [
  { id: 'eq', label: 'gleich' },
  { id: 'ne', label: 'ungleich' },
  { id: 'gt', label: 'größer als' },
  { id: 'gte', label: 'größer oder gleich' },
  { id: 'lt', label: 'kleiner als' },
  { id: 'lte', label: 'kleiner oder gleich' },
  { id: 'in', label: 'in Liste' },
]

const emptyRule: SegmentRule = { attribute: 'orderCount', operator: 'gte', value: 0 }

function SegmentsMainView(props: {
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
}) {
  const {
    segments, audienceCounts, sheetOpen, editingId, form,
    audienceCount, audienceLoading, audiencePreview, previewLoading,
    saveError, deleteConfirm, saving,
    onOpenCreate, onOpenEdit, onCloseSheet, onAddRule, onUpdateRule, onRemoveRule,
    onFetchAudience, onFetchAudiencePreview, onSave, onDelete, onSetDeleteConfirm, onFormChange,
  } = props
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Kundensegmente</h1>
            <p className="text-muted-foreground mt-1">Zielgruppen für Kampagnen und Automation.</p>
          </div>
          <Button
            onClick={onOpenCreate}
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
            <Button onClick={onOpenCreate} className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
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
                    {audienceCounts[seg.id] !== undefined ? `${audienceCounts[seg.id]} Kunden` : '— Kunden'}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {Array.isArray(seg.rules) && seg.rules.length > 0 ? `${seg.rules.length} Regel(n)` : '0 Regeln'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => onOpenEdit(seg)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => { onOpenEdit(seg); onSetDeleteConfirm(seg.id) }}
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

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && onCloseSheet()}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Segment bearbeiten' : 'Neues Segment'}</SheetTitle>
            <SheetDescription>
              {editingId ? 'Name, Beschreibung und Regeln anpassen.' : 'Zielgruppe anlegen und Regeln definieren.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6 space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="seg-name">Name *</Label>
              <Input
                id="seg-name"
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                placeholder="z. B. Stammkunden"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seg-desc">Beschreibung</Label>
              <Input
                id="seg-desc"
                value={form.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Kombination der Regeln</Label>
              <select
                value={form.rulesCombination}
                onChange={(e) => onFormChange({ rulesCombination: e.target.value as 'AND' | 'OR' })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="AND">Alle Regeln (UND)</option>
                <option value="OR">Mindestens eine Regel (ODER)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Zielgruppen-Regeln</Label>
              {form.rules.map((rule, idx) => (
                <Card key={idx} className="p-3 rounded-xl border-border/50">
                  <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                    <div className="grid gap-1">
                      <span className="text-xs text-muted-foreground">Attribut</span>
                      <select
                        value={rule.attribute}
                        onChange={(e) => onUpdateRule(idx, { attribute: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {SEGMENT_ATTRIBUTES.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-xs text-muted-foreground">Operator</span>
                      <select
                        value={rule.operator}
                        onChange={(e) => onUpdateRule(idx, { operator: e.target.value as SegmentRule['operator'] })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {operators.map((o) => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => onRemoveRule(idx)} aria-label="Regel entfernen">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="col-span-2 grid gap-1">
                      <span className="text-xs text-muted-foreground">Wert</span>
                      <Input
                        className="h-9"
                        type={SEGMENT_ATTRIBUTES.find((a) => a.id === rule.attribute)?.valueType === 'number' ? 'number' : 'text'}
                        value={typeof rule.value === 'number' ? String(rule.value) : Array.isArray(rule.value) ? rule.value.join(',') : String(rule.value ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value
                          const att = SEGMENT_ATTRIBUTES.find((a) => a.id === rule.attribute)
                          const num = att?.valueType === 'number' ? parseFloat(raw) || 0 : raw
                          onUpdateRule(idx, { value: num })
                        }}
                        placeholder="Wert"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onAddRule}>
                <Plus className="h-3.5 w-3.5" />
                Regel hinzufügen
              </Button>
            </div>
            {editingId && (
              <div>
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Zielgruppengröße:</Label>
                  {audienceLoading ? (
                    <span className="text-sm text-muted-foreground">Berechnung…</span>
                  ) : audienceCount !== null ? (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      {audienceCount} Kunden
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onFetchAudience(editingId)} disabled={audienceLoading}>
                      Berechnen
                    </Button>
                  )}
                </div>
                <div className="space-y-2 border-t pt-4">
                  <Label>Kunden-Preview (max. 50)</Label>
                  <p className="text-xs text-muted-foreground">Kunden im Segment und die erfüllten Regeln.</p>
                  {previewLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Lade Preview…
                    </div>
                  ) : audiencePreview ? (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      {audiencePreview.usersWithRules.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">Keine Kunden im Segment (oder keine Regeln definiert).</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                <th className="text-left p-2 font-medium">Kunde</th>
                                <th className="text-left p-2 font-medium">Erfüllte Regeln</th>
                              </tr>
                            </thead>
                            <tbody>
                              {audiencePreview.usersWithRules.map((u) => (
                                <tr key={u.id} className="border-t border-border/50">
                                  <td className="p-2 align-top">
                                    <div className="font-medium">{u.name || u.email || u.id}</div>
                                    {u.name && u.email && <div className="text-xs text-muted-foreground">{u.email}</div>}
                                  </td>
                                  <td className="p-2 align-top">
                                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                      {u.matchedRuleLabels.map((label, i) => (
                                        <li key={i}>{label}</li>
                                      ))}
                                    </ul>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {audiencePreview.count > audiencePreview.usersWithRules.length && (
                        <p className="p-2 text-xs text-muted-foreground border-t border-border/50">
                          Weitere {audiencePreview.count - audiencePreview.usersWithRules.length} Kunden im Segment.
                        </p>
                      )}
                    </div>
                  )}
                  {editingId && !previewLoading && !audiencePreview && (
                    <Button variant="outline" size="sm" onClick={() => onFetchAudiencePreview(editingId)}>
                      Preview laden
                    </Button>
                  )}
                </div>
              </div>
            )}
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {deleteConfirm === editingId && editingId && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                <p className="text-sm">Segment wirklich löschen? Workflows/In-App-Nachrichten, die dieses Segment nutzen, müssen zuvor angepasst werden.</p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => onDelete(editingId)}>Löschen</Button>
                  <Button variant="outline" size="sm" onClick={() => onSetDeleteConfirm(null)}>Abbrechen</Button>
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={onCloseSheet} disabled={saving}>Abbrechen</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', rulesCombination: 'AND' as 'AND' | 'OR', rules: [] as SegmentRule[] })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [audienceLoading, setAudienceLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({})
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [audiencePreview, setAudiencePreview] = useState<{ count: number; ruleLabels: string[]; usersWithRules: UserWithRules[] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

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
    setSheetOpen(true)
  }

  const fetchAudiencePreview = useCallback(async (segmentId: string) => {
    setPreviewLoading(true)
    setAudiencePreview(null)
    try {
      const res = await fetch(`/api/admin/segments/${segmentId}/audience?showRuleMatch=true&limit=50`)
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
      rulesCombination: (seg.rulesCombination === 'OR' ? 'OR' : 'AND') as 'AND' | 'OR',
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
    setForm((f) => ({ ...f, rules: [...f.rules, { ...emptyRule }] }))
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
    );
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
    );
  }

  return (
    <SegmentsMainView
      segments={segments}
      audienceCounts={audienceCounts}
      sheetOpen={sheetOpen}
      editingId={editingId}
      form={form}
      audienceCount={audienceCount}
      audienceLoading={audienceLoading}
      audiencePreview={audiencePreview}
      previewLoading={previewLoading}
      saveError={saveError}
      deleteConfirm={deleteConfirm}
      saving={saving}
      onOpenCreate={openCreate}
      onOpenEdit={openEdit}
      onCloseSheet={closeSheet}
      onAddRule={addRule}
      onUpdateRule={updateRule}
      onRemoveRule={removeRule}
      onFetchAudience={fetchAudience}
      onFetchAudiencePreview={fetchAudiencePreview}
      onSave={handleSave}
      onDelete={handleDelete}
      onSetDeleteConfirm={setDeleteConfirm}
      onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
    />
  )
}
