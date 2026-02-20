'use client'

import React from 'react'
import { BellRing, Plus, Send, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

type PushStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED'

type PushCampaign = {
  id: string
  pushTitle: string
  pushBody: string
  status: PushStatus
  scheduledAt: string | null
  sentAt: string | null
  totalRecipients: number
  segment: { id: string; name: string }
  marketingTemplate: { id: string; name: string } | null
  createdAt: string
}

const statusConfig: Record<PushStatus, { label: string; className: string; icon: React.ElementType }> = {
  DRAFT:     { label: 'Entwurf',   className: 'text-gray-500 border-gray-200',   icon: AlertCircle },
  SCHEDULED: { label: 'Geplant',   className: 'text-blue-600 border-blue-200',   icon: Clock },
  SENT:      { label: 'Gesendet',  className: 'text-green-600 border-green-200', icon: CheckCircle2 },
  FAILED:    { label: 'Fehler',    className: 'text-red-600 border-red-200',      icon: XCircle },
}

function formatDate(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PushPage() {
  const [campaigns, setCampaigns] = React.useState<PushCampaign[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState<string | null>(null)

  const loadCampaigns = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/marketing/push')
      const data = await res.json()
      setCampaigns(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Kampagnen konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const handleSendNow = async (campaignId: string) => {
    if (!confirm('Push-Kampagne jetzt sofort versenden?')) return
    setSending(campaignId)
    try {
      const res = await fetch('/api/admin/marketing/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast.success(`Gesendet: ${data.sentCount} Empfänger${data.failedCount > 0 ? `, ${data.failedCount} Fehler` : ''}`)
      loadCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Senden fehlgeschlagen')
    } finally {
      setSending(null)
    }
  }

  const totalSent = campaigns.filter(c => c.status === 'SENT').length
  const totalScheduled = campaigns.filter(c => c.status === 'SCHEDULED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-600" />
            Push-Benachrichtigungen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gesendete und geplante Push-Kampagnen
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          onClick={() => window.location.href = '/admin/marketing/templates'}
        >
          <Plus className="w-4 h-4" />
          Neue Kampagne
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kampagnen gesamt</CardDescription>
            <CardTitle className="text-3xl">{campaigns.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesendet</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalSent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Geplant</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{totalScheduled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Lade Kampagnen...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <BellRing className="w-10 h-10 opacity-30" />
              <p className="text-sm">Noch keine Push-Kampagnen</p>
              <p className="text-xs text-center max-w-xs">
                Erstelle eine Template-Vorlage und veröffentliche sie als Push-Benachrichtigung.
              </p>
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Titel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empfänger</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gesendet / Geplant</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const status = statusConfig[c.status]
                    const StatusIcon = status.icon
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.pushTitle}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{c.pushBody}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.segment?.name ?? '–'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`gap-1 ${status.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.status === 'SENT' ? c.totalRecipients : '–'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {c.sentAt ? formatDate(c.sentAt) : c.scheduledAt ? formatDate(c.scheduledAt) : '–'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs"
                                disabled={sending === c.id}
                                onClick={() => handleSendNow(c.id)}
                              >
                                <Send className="w-3 h-3" />
                                {sending === c.id ? 'Sende...' : 'Jetzt senden'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
