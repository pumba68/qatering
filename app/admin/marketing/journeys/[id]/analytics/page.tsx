'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, Users, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Journey } from '@/components/marketing/journey/journey-types'
import { STATUS_CONFIG } from '@/components/marketing/journey/journey-types'

interface Analytics {
  totalEntered: number
  activeCount: number
  convertedCount: number
  failedCount: number
  exitedCount: number
  completedCount: number
  conversionRate: number
}

interface Participant {
  id: string
  status: string
  currentNodeId: string | null
  enteredAt: string
  convertedAt: string | null
  exitedAt: string | null
  nextStepAt: string | null
  user: { id: string; email: string; name: string | null }
}

interface LogEntry {
  id: string
  nodeId: string | null
  eventType: string
  status: string
  details: Record<string, unknown> | null
  createdAt: string
  participant: {
    id: string
    user: { id: string; email: string; name: string | null }
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  CONVERTED: 'bg-blue-100 text-blue-700',
  EXITED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
}

const LOG_STATUS_BADGE: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-gray-100 text-gray-600',
}

const NODE_TYPE_BADGE: Record<string, string> = {
  start: 'bg-gray-100 text-gray-600',
  end: 'bg-gray-100 text-gray-600',
  email: 'bg-blue-100 text-blue-700',
  push: 'bg-green-100 text-green-700',
  inapp: 'bg-purple-100 text-purple-700',
  delay: 'bg-amber-100 text-amber-700',
  branch: 'bg-orange-100 text-orange-700',
  incentive: 'bg-yellow-100 text-yellow-800',
}

const NODE_TYPE_LABEL: Record<string, string> = {
  start: 'Start',
  end: 'Ende',
  email: 'E-Mail',
  push: 'Push',
  inapp: 'In-App',
  delay: 'Wartezeit',
  branch: 'Bedingung',
  incentive: 'Incentive',
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  ENTERED: 'Journey beigetreten',
  CONVERTED: 'Konvertiert',
  EXITED: 'Journey verlassen',
  FAILED: 'Fehler aufgetreten',
  STEP_EXECUTED: 'Schritt ausgeführt',
}

function getLogLabel(log: LogEntry): string {
  if (log.details?.label) return log.details.label as string
  return EVENT_TYPE_LABEL[log.eventType] ?? log.eventType
}

function getLogNodeType(log: LogEntry): string | null {
  if (log.details?.nodeType) return log.details.nodeType as string
  if (log.eventType === 'ENTERED') return 'start'
  return null
}

function formatDate(d: string) {
  try {
    return format(new Date(d), 'dd.MM.yyyy HH:mm', { locale: de })
  } catch {
    return d
  }
}

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  const [journey, setJourney] = useState<Journey | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')
  const [participantSearch, setParticipantSearch] = useState('')
  const [participantStatus, setParticipantStatus] = useState('all')
  const [logStatus, setLogStatus] = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [journeyRes, analyticsRes, participantsRes, logsRes] = await Promise.all([
        fetch(`/api/admin/marketing/journeys/${params.id}`),
        fetch(`/api/admin/marketing/journeys/${params.id}/analytics?days=${days}`),
        fetch(`/api/admin/marketing/journeys/${params.id}/participants?limit=50`),
        fetch(`/api/admin/marketing/journeys/${params.id}/logs?limit=100`),
      ])

      if (journeyRes.ok) setJourney(await journeyRes.json())
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      if (participantsRes.ok) {
        const d = await participantsRes.json()
        setParticipants(d.participants ?? [])
      }
      if (logsRes.ok) {
        const d = await logsRes.json()
        setLogs(d.logs ?? [])
      }
    } catch {
      toast.error('Fehler beim Laden der Analytics')
    } finally {
      setLoading(false)
    }
  }, [params.id, days])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filteredParticipants = participants.filter((p) => {
    if (participantStatus !== 'all' && p.status !== participantStatus) return false
    if (participantSearch) {
      const q = participantSearch.toLowerCase()
      return (
        p.user.email.toLowerCase().includes(q) ||
        (p.user.name ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const filteredLogs = logs.filter((l) => {
    if (logStatus !== 'all' && l.status !== logStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Journey nicht gefunden</p>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[journey.status]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/admin/marketing/journeys">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900 truncate">{journey.name}</h1>
            <Badge className={`text-xs ${statusCfg.color} border-0`}>{statusCfg.label}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Analytics & Ausführungslog</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Letzte 7 Tage</SelectItem>
              <SelectItem value="30">Letzte 30 Tage</SelectItem>
              <SelectItem value="90">Letzte 90 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" asChild>
            <Link href={`/admin/marketing/journeys/${params.id}/canvas`}>
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Bearbeiten
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      {analytics && (
        <div className="grid grid-cols-5 gap-3 px-6 py-4 bg-gray-50 border-b flex-shrink-0">
          <MetricCard
            icon={<Users className="w-4 h-4 text-blue-600" />}
            color="bg-blue-50"
            label="Eingetreten"
            value={analytics.totalEntered}
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4 text-green-600" />}
            color="bg-green-50"
            label="Aktiv"
            value={analytics.activeCount}
          />
          <MetricCard
            icon={<CheckCircle className="w-4 h-4 text-blue-600" />}
            color="bg-blue-50"
            label="Konvertiert"
            value={analytics.convertedCount}
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
            color="bg-purple-50"
            label="Konversionsrate"
            value={`${analytics.conversionRate}%`}
          />
          <MetricCard
            icon={<AlertCircle className="w-4 h-4 text-red-500" />}
            color="bg-red-50"
            label="Fehlgeschlagen"
            value={analytics.failedCount}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="participants" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 mb-0 flex-shrink-0">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="logs">Ausführungslog</TabsTrigger>
          </TabsList>

          {/* Participants Tab */}
          <TabsContent value="participants" className="flex-1 overflow-hidden flex flex-col m-0 mt-4">
            <div className="px-6 pb-3 flex gap-3 flex-shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Input
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Nutzer suchen..."
                  className="h-8 text-xs"
                />
              </div>
              <Select value={participantStatus} onValueChange={setParticipantStatus}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="CONVERTED">Konvertiert</SelectItem>
                  <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                  <SelectItem value="EXITED">Ausgetreten</SelectItem>
                  <SelectItem value="FAILED">Fehler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Keine Participants
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Nutzer</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Eingetreten</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Konvertiert</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Nächster Schritt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <p className="font-medium text-gray-800 text-xs">{p.user.name ?? p.user.email}</p>
                          <p className="text-xs text-gray-400">{p.user.email}</p>
                        </td>
                        <td className="py-2 px-2">
                          <Badge className={`text-xs border-0 ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-500">{formatDate(p.enteredAt)}</td>
                        <td className="py-2 px-2 text-xs text-gray-500">
                          {p.convertedAt ? formatDate(p.convertedAt) : '—'}
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-500">
                          {p.nextStepAt ? formatDate(p.nextStepAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 overflow-hidden flex flex-col m-0 mt-4">
            <div className="px-6 pb-3 flex gap-3 flex-shrink-0">
              <Select value={logStatus} onValueChange={setLogStatus}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="SUCCESS">Erfolg</SelectItem>
                  <SelectItem value="FAILED">Fehler</SelectItem>
                  <SelectItem value="SKIPPED">Übersprungen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Keine Logs
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Zeitpunkt</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Nutzer</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Schritt</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const nodeType = getLogNodeType(log)
                      const label = getLogLabel(log)
                      return (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-2 px-2 text-xs text-gray-700 whitespace-nowrap">
                            {log.participant?.user.name
                              ? <><span className="font-medium">{log.participant.user.name}</span><br /><span className="text-gray-400">{log.participant.user.email}</span></>
                              : (log.participant?.user.email ?? '—')}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-start gap-1.5">
                              {nodeType && (
                                <Badge className={`text-xs border-0 shrink-0 ${NODE_TYPE_BADGE[nodeType] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {NODE_TYPE_LABEL[nodeType] ?? nodeType}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-700 leading-tight">{label}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <Badge
                              className={`text-xs border-0 ${LOG_STATUS_BADGE[log.status] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {log.status === 'SUCCESS' ? 'Erfolg' : log.status === 'FAILED' ? 'Fehler' : log.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode
  color: string
  label: string
  value: number | string
}) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
