'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Zap, Users, TrendingUp, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { JourneyCard } from '@/components/marketing/journey/JourneyCard'
import type { Journey } from '@/components/marketing/journey/journey-types'

export default function JourneysPage() {
  const router = useRouter()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [newJourney, setNewJourney] = useState({
    name: '',
    description: '',
    triggerType: 'EVENT' as 'EVENT' | 'SEGMENT_ENTRY' | 'DATE_BASED',
  })

  const fetchJourneys = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/marketing/journeys?${params}`)
      const data = await res.json()
      setJourneys(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Fehler beim Laden der Journeys')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchJourneys()
  }, [fetchJourneys])

  const handleCreate = async () => {
    if (!newJourney.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/marketing/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newJourney.name.trim(),
          description: newJourney.description.trim() || undefined,
          triggerType: newJourney.triggerType,
          triggerConfig: {},
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler beim Erstellen')
      }
      const created: Journey = await res.json()
      toast.success('Journey erstellt')
      setShowCreate(false)
      router.push(`/admin/marketing/journeys/${created.id}/canvas`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Erstellen')
    } finally {
      setCreating(false)
    }
  }

  const handlePause = async (id: string) => {
    try {
      await fetch(`/api/admin/marketing/journeys/${id}/pause`, { method: 'POST' })
      toast.success('Journey pausiert')
      fetchJourneys()
    } catch {
      toast.error('Fehler beim Pausieren')
    }
  }

  const handleResume = async (id: string) => {
    try {
      await fetch(`/api/admin/marketing/journeys/${id}/resume`, { method: 'POST' })
      toast.success('Journey fortgesetzt')
      fetchJourneys()
    } catch {
      toast.error('Fehler beim Fortsetzen')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/marketing/journeys/${id}/duplicate`, { method: 'POST' })
      const copy: Journey = await res.json()
      toast.success('Journey dupliziert')
      router.push(`/admin/marketing/journeys/${copy.id}/canvas`)
    } catch {
      toast.error('Fehler beim Duplizieren')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Journey wirklich löschen?')) return
    try {
      await fetch(`/api/admin/marketing/journeys/${id}`, { method: 'DELETE' })
      toast.success('Journey gelöscht')
      fetchJourneys()
    } catch {
      toast.error('Fehler beim Löschen')
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Journey archivieren? Dies kann nicht rückgängig gemacht werden.')) return
    try {
      await fetch(`/api/admin/marketing/journeys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      toast.success('Journey archiviert')
      fetchJourneys()
    } catch {
      toast.error('Fehler beim Archivieren')
    }
  }

  const handleExecuteNow = async () => {
    setExecuting(true)
    try {
      const res = await fetch('/api/admin/marketing/journeys/execute', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Ausführen')
      toast.success(
        `Cron ausgeführt: ${data.processed} Participant(s) verarbeitet` +
          (data.errors > 0 ? `, ${data.errors} Fehler` : '')
      )
      fetchJourneys()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Ausführen')
    } finally {
      setExecuting(false)
    }
  }

  // Stats
  const totalJourneys = journeys.length
  const activeJourneys = journeys.filter((j) => j.status === 'ACTIVE').length
  const totalActiveParticipants = journeys.reduce((s, j) => s + (j.activeParticipants ?? 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Journeys</h1>
          <p className="text-sm text-gray-500 mt-0.5">Marketing-Automatisierungs-Abläufe verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecuteNow}
            disabled={executing}
            title="Cron-Job sofort ausführen (nur für Tests)"
            className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <Play className={`w-3.5 h-3.5 ${executing ? 'animate-pulse' : ''}`} />
            {executing ? 'Läuft…' : 'Jetzt ausführen'}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Neue Journey
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b">
        <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalJourneys}</p>
            <p className="text-xs text-gray-500">Journeys gesamt</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{activeJourneys}</p>
            <p className="text-xs text-gray-500">Aktive Journeys</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalActiveParticipants}</p>
            <p className="text-xs text-gray-500">Aktive Participants</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Journey suchen..."
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="DRAFT">Entwurf</SelectItem>
            <SelectItem value="ACTIVE">Aktiv</SelectItem>
            <SelectItem value="PAUSED">Pausiert</SelectItem>
            <SelectItem value="ARCHIVED">Archiviert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Journey Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {search || statusFilter !== 'all' ? 'Keine Ergebnisse' : 'Erste Journey erstellen'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {search || statusFilter !== 'all'
                ? 'Suche anpassen oder Filter zurücksetzen.'
                : 'Erstelle automatisierte Marketing-Abläufe mit mehreren Schritten, Bedingungen und Nachrichten.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Erste Journey erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {journeys.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                onPause={handlePause}
                onResume={handleResume}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Journey erstellen</DialogTitle>
            <DialogDescription>
              Definiere Name und Trigger für deine neue Journey. Anschließend kannst du den
              Canvas-Editor öffnen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={newJourney.name}
                onChange={(e) => setNewJourney((p) => ({ ...p, name: e.target.value }))}
                placeholder="z.B. Willkommens-Journey"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Beschreibung (optional)</Label>
              <Textarea
                value={newJourney.description}
                onChange={(e) => setNewJourney((p) => ({ ...p, description: e.target.value }))}
                placeholder="Kurze Beschreibung..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger-Typ</Label>
              <Select
                value={newJourney.triggerType}
                onValueChange={(v) =>
                  setNewJourney((p) => ({
                    ...p,
                    triggerType: v as 'EVENT' | 'SEGMENT_ENTRY' | 'DATE_BASED',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENT">Event-basiert</SelectItem>
                  <SelectItem value="SEGMENT_ENTRY">Segment-Eintritt</SelectItem>
                  <SelectItem value="DATE_BASED">Datum-basiert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreate(false)}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={!newJourney.name.trim() || creating}
            >
              {creating ? 'Erstellen...' : 'Journey erstellen →'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
