'use client'

import React from 'react'
import { Megaphone, Plus, Trash2, Power, PowerOff, Eye, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type Segment = { id: string; name: string }

type InAppMessage = {
  id: string
  title: string | null
  body: string
  displayPlace: string
  displayType: string
  slotId: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  segment: Segment
  marketingTemplateId: string | null
  _count?: { reads: number }
}

const displayPlaceLabels: Record<string, string> = {
  menu: 'Menü',
  wallet: 'Wallet',
  dashboard: 'Dashboard',
}

const displayTypeLabels: Record<string, string> = {
  BANNER: 'Banner',
  POPUP: 'Popup',
  SLOT: 'Slot',
}

function formatDate(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatusBadge({ isActive, endDate }: { isActive: boolean; endDate: string | null }) {
  if (!isActive) return <Badge variant="secondary">Inaktiv</Badge>
  if (endDate && new Date(endDate) < new Date()) return <Badge variant="outline" className="text-amber-600 border-amber-300">Abgelaufen</Badge>
  return <Badge className="bg-green-100 text-green-700 border-green-200">Aktiv</Badge>
}

export default function InAppMonitoringPage() {
  const [messages, setMessages] = React.useState<InAppMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filterType, setFilterType] = React.useState<string>('all')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  const loadMessages = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/marketing/in-app-messages?includeInactive=true')
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Nachrichten konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadMessages() }, [loadMessages])

  const handleToggleActive = async (msg: InAppMessage) => {
    try {
      const res = await fetch(`/api/admin/marketing/in-app-messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !msg.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(msg.isActive ? 'Nachricht deaktiviert' : 'Nachricht aktiviert')
      loadMessages()
    } catch {
      toast.error('Aktion fehlgeschlagen')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Nachricht wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/marketing/in-app-messages/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Nachricht gelöscht')
      loadMessages()
    } catch {
      toast.error('Löschen fehlgeschlagen')
    }
  }

  const filtered = messages.filter((m) => {
    if (filterType !== 'all' && m.displayType !== filterType) return false
    if (filterStatus === 'active' && !m.isActive) return false
    if (filterStatus === 'inactive' && m.isActive) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-violet-600" />
            In-App Nachrichten
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aktive und geplante Banner & Popups in der Kunden-App
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          onClick={() => window.location.href = '/admin/marketing/templates'}
        >
          <Plus className="w-4 h-4" />
          Neue Nachricht
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-3xl">{messages.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktiv</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {messages.filter(m => m.isActive && (!m.endDate || new Date(m.endDate) >= new Date())).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inaktiv / Abgelaufen</CardDescription>
            <CardTitle className="text-3xl text-gray-400">
              {messages.filter(m => !m.isActive || (m.endDate && new Date(m.endDate) < new Date())).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="BANNER">Banner</SelectItem>
            <SelectItem value="POPUP">Popup</SelectItem>
            <SelectItem value="SLOT">Slot</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Lade Nachrichten...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Megaphone className="w-10 h-10 opacity-30" />
              <p className="text-sm">Keine Nachrichten gefunden</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/admin/marketing/templates'}
              >
                Vorlage erstellen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anzeigeort</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zeitraum</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((msg) => (
                    <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{msg.title || msg.body.slice(0, 40)}</p>
                          {msg.marketingTemplateId && (
                            <p className="text-xs text-violet-500 mt-0.5">Block-Editor Template</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{displayTypeLabels[msg.displayType] ?? msg.displayType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{msg.segment?.name ?? '–'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {displayPlaceLabels[msg.displayPlace] ?? msg.displayPlace}
                        {msg.slotId && <span className="text-xs ml-1 opacity-60">({msg.slotId})</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(msg.startDate)}
                        {msg.endDate ? ` – ${formatDate(msg.endDate)}` : ' – ∞'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={msg.isActive} endDate={msg.endDate} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title={msg.isActive ? 'Deaktivieren' : 'Aktivieren'}
                            onClick={() => handleToggleActive(msg)}
                          >
                            {msg.isActive
                              ? <PowerOff className="w-3.5 h-3.5 text-amber-500" />
                              : <Power className="w-3.5 h-3.5 text-green-500" />
                            }
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Löschen"
                            onClick={() => handleDelete(msg.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
