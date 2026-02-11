'use client'

import { useCallback, useEffect, useState } from 'react'
import { Zap, Plus, Pencil, Trash2, Clock, Play } from 'lucide-react'
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

type Segment = { id: string; name: string }
type Workflow = {
  id: string
  name: string
  segmentId: string
  segment: Segment
  triggerType: string
  triggerConfig: Record<string, unknown>
  actionType: string
  actionConfig: Record<string, unknown>
  isActive: boolean
  executionLogs?: { id: string; executedAt: string; status: string; message: string | null }[]
}
type LogEntry = { id: string; executedAt: string; status: string; message: string | null }

const triggerLabels: Record<string, string> = {
  SCHEDULED: 'Zeitgesteuert',
  EVENT: 'Ereignis',
}
const actionLabels: Record<string, string> = {
  SEND_EMAIL: 'E-Mail senden',
  SHOW_IN_APP: 'In-App anzeigen',
  GRANT_INCENTIVE: 'Incentive vergeben',
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    segmentId: '',
    triggerType: 'SCHEDULED' as 'SCHEDULED' | 'EVENT',
    triggerConfig: {} as Record<string, unknown>,
    actionType: 'SEND_EMAIL' as 'SEND_EMAIL' | 'SHOW_IN_APP' | 'GRANT_INCENTIVE',
    actionConfig: {} as Record<string, unknown>,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsOpen, setLogsOpen] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/marketing/workflows?includeInactive=true')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setWorkflows(Array.isArray(data) ? data : [])
    } catch {
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/segments')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSegments(Array.isArray(data) ? data : [])
    } catch {
      setSegments([])
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
    fetchSegments()
  }, [fetchWorkflows, fetchSegments])

  const fetchLogs = useCallback(async (workflowId: string) => {
    const res = await fetch(`/api/admin/marketing/workflows/${workflowId}/logs?limit=20`)
    const data = await res.json().catch(() => [])
    setLogs(Array.isArray(data) ? data : [])
    setLogsOpen(workflowId)
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      segmentId: segments[0]?.id ?? '',
      triggerType: 'SCHEDULED',
      triggerConfig: {},
      actionType: 'SEND_EMAIL',
      actionConfig: {},
      isActive: true,
    })
    setSaveError(null)
    setSheetOpen(true)
  }

  const openEdit = (w: Workflow) => {
    setEditingId(w.id)
    setForm({
      name: w.name,
      segmentId: w.segmentId,
      triggerType: (w.triggerType as 'SCHEDULED' | 'EVENT') || 'SCHEDULED',
      triggerConfig: (w.triggerConfig as Record<string, unknown>) ?? {},
      actionType: (w.actionType as 'SEND_EMAIL' | 'SHOW_IN_APP' | 'GRANT_INCENTIVE') || 'SEND_EMAIL',
      actionConfig: (w.actionConfig as Record<string, unknown>) ?? {},
      isActive: w.isActive,
    })
    setSaveError(null)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setEditingId(null)
    setLogsOpen(null)
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setSaveError('Name ist Pflichtfeld.')
      return
    }
    if (!form.segmentId) {
      setSaveError('Segment ist erforderlich.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/marketing/workflows/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            segmentId: form.segmentId,
            triggerType: form.triggerType,
            triggerConfig: form.triggerConfig,
            actionType: form.actionType,
            actionConfig: form.actionConfig,
            isActive: form.isActive,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.')
      } else {
        const res = await fetch('/api/admin/marketing/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            segmentId: form.segmentId,
            triggerType: form.triggerType,
            triggerConfig: form.triggerConfig,
            actionType: form.actionType,
            actionConfig: form.actionConfig,
            isActive: form.isActive,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Anlegen fehlgeschlagen.')
      }
      await fetchWorkflows()
      closeSheet()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (w: Workflow) => {
    try {
      const res = await fetch(`/api/admin/marketing/workflows/${w.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !w.isActive }),
      })
      if (!res.ok) throw new Error('Aktualisierung fehlgeschlagen.')
      await fetchWorkflows()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Workflow wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/marketing/workflows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen.')
      await fetchWorkflows()
      if (editingId === id) closeSheet()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const lastLog = (w: Workflow) => w.executionLogs?.[0]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Automation</h1>
            <p className="text-muted-foreground mt-1">Workflows mit Trigger und Aktion verwalten.</p>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2 shrink-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-[1.02] transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Neuer Workflow
          </Button>
        </div>
      </div>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      {loading ? (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </CardContent>
        </Card>
      ) : workflows.length === 0 ? (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">Noch keine Workflows.</p>
            <Button onClick={openCreate} className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="h-4 w-4" />
              Neuer Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((w) => (
            <Card key={w.id} className="rounded-2xl border border-border/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{w.name}</CardTitle>
                  <Badge variant={w.isActive ? 'default' : 'secondary'} className={w.isActive ? 'bg-green-600' : ''}>
                    {w.isActive ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <CardDescription>
                  {w.segment?.name ?? '—'} · {triggerLabels[w.triggerType] ?? w.triggerType} → {actionLabels[w.actionType] ?? w.actionType}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {lastLog(w) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Letzte Ausführung: {new Date(lastLog(w)!.executedAt).toLocaleString()} · {lastLog(w)!.message || lastLog(w)!.status}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(w)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(w)}>
                    {w.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => fetchLogs(w.id)}>
                    <Play className="h-3.5 w-3.5" />
                    Protokoll
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => handleDelete(w.id)}>
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
            <SheetTitle>{editingId ? 'Workflow bearbeiten' : 'Neuer Workflow'}</SheetTitle>
            <SheetDescription>Trigger und Aktion konfigurieren.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Reaktivierungs-E-Mail"
              />
            </div>
            <div className="grid gap-2">
              <Label>Segment</Label>
              <select
                value={form.segmentId}
                onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">— wählen —</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Trigger-Typ</Label>
              <select
                value={form.triggerType}
                onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value as 'SCHEDULED' | 'EVENT' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="SCHEDULED">Zeitgesteuert</option>
                <option value="EVENT">Ereignis</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Aktion</Label>
              <select
                value={form.actionType}
                onChange={(e) => setForm((f) => ({ ...f, actionType: e.target.value as 'SEND_EMAIL' | 'SHOW_IN_APP' | 'GRANT_INCENTIVE' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="SEND_EMAIL">E-Mail senden</option>
                <option value="SHOW_IN_APP">In-App anzeigen</option>
                <option value="GRANT_INCENTIVE">Incentive vergeben</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wf-active"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="wf-active">Aktiv</Label>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {logsOpen === editingId && logs.length > 0 && (
              <div className="space-y-2">
                <Label>Protokoll (letzte Ausführungen)</Label>
                <ul className="rounded-lg border border-border/50 divide-y text-sm max-h-48 overflow-y-auto">
                  {logs.map((log) => (
                    <li key={log.id} className="p-2 flex flex-col gap-0.5">
                      <span className="text-muted-foreground">{new Date(log.executedAt).toLocaleString()}</span>
                      <span className={log.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : log.status === 'FAILED' ? 'text-destructive' : ''}>
                        {log.status} {log.message && `· ${log.message}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={closeSheet} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {logsOpen && !sheetOpen && (
        <Sheet open={!!logsOpen} onOpenChange={(open) => !open && setLogsOpen(null)}>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Workflow-Protokoll</SheetTitle>
              <SheetDescription>Letzte Ausführungen.</SheetDescription>
            </SheetHeader>
            <ul className="py-6 space-y-2 divide-y text-sm">
              {logs.map((log) => (
                <li key={log.id} className="py-2 flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{new Date(log.executedAt).toLocaleString()}</span>
                  <span className={log.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : log.status === 'FAILED' ? 'text-destructive' : ''}>
                    {log.status} {log.message && `· ${log.message}`}
                  </span>
                </li>
              ))}
              {logs.length === 0 && <li className="text-muted-foreground">Keine Einträge.</li>}
            </ul>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
