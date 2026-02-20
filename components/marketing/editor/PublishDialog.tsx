'use client'

import React from 'react'
import { toast } from 'sonner'
import { Loader2, Send, Megaphone, BellRing, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = 'inapp' | 'push'
type Step = 'channel' | 'config' | 'confirm'

interface Segment {
  id: string
  name: string
}

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: PublishDialogProps) {
  const [step, setStep] = React.useState<Step>('channel')
  const [channel, setChannel] = React.useState<Channel | null>(null)
  const [segments, setSegments] = React.useState<Segment[]>([])
  const [loadingSegments, setLoadingSegments] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // InApp config
  const [inappSegmentId, setInappSegmentId] = React.useState('')
  const [inappDisplayPlace, setInappDisplayPlace] = React.useState<string>('menu')
  const [inappDisplayType, setInappDisplayType] = React.useState<string>('BANNER')
  const [inappStartDate, setInappStartDate] = React.useState('')
  const [inappEndDate, setInappEndDate] = React.useState('')

  // Push config
  const [pushSegmentId, setPushSegmentId] = React.useState('')
  const [pushTitle, setPushTitle] = React.useState('')
  const [pushBody, setPushBody] = React.useState('')
  const [pushDeepLink, setPushDeepLink] = React.useState('')
  const [pushScheduledAt, setPushScheduledAt] = React.useState('')

  // Load segments once dialog opens
  React.useEffect(() => {
    if (!open) {
      // Reset on close
      setStep('channel')
      setChannel(null)
      return
    }
    setLoadingSegments(true)
    fetch('/api/admin/segments')
      .then((r) => r.json())
      .then((data: Segment[]) => setSegments(Array.isArray(data) ? data : []))
      .catch(() => setSegments([]))
      .finally(() => setLoadingSegments(false))
  }, [open])

  const handleChannelSelect = (c: Channel) => {
    setChannel(c)
    setStep('config')
  }

  const handleBack = () => {
    if (step === 'config') setStep('channel')
    if (step === 'confirm') setStep('config')
  }

  const handleNext = () => {
    if (step === 'config') setStep('confirm')
  }

  const canAdvanceFromConfig = () => {
    if (channel === 'inapp') return !!inappSegmentId
    if (channel === 'push') return !!pushSegmentId && pushTitle.length > 0 && pushBody.length > 0
    return false
  }

  const handlePublish = async () => {
    setSubmitting(true)
    try {
      if (channel === 'inapp') {
        const res = await fetch('/api/admin/marketing/in-app-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            segmentId: inappSegmentId,
            displayPlace: inappDisplayPlace,
            displayType: inappDisplayType,
            startDate: inappStartDate || undefined,
            endDate: inappEndDate || undefined,
            isActive: true,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Fehler beim Veröffentlichen')
        }
        toast.success('Banner/Popup wurde veröffentlicht')
      } else if (channel === 'push') {
        // Create campaign
        const res = await fetch('/api/admin/marketing/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            segmentId: pushSegmentId,
            pushTitle,
            pushBody,
            deepLink: pushDeepLink || null,
            scheduledAt: pushScheduledAt || null,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Fehler beim Erstellen der Kampagne')
        }
        const campaign = await res.json()

        // If no scheduled date → send immediately
        if (!pushScheduledAt) {
          const sendRes = await fetch('/api/admin/marketing/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: campaign.id }),
          })
          if (!sendRes.ok) {
            const err = await sendRes.json()
            throw new Error(err.error || 'Fehler beim Senden')
          }
          const result = await sendRes.json()
          toast.success(
            `Push gesendet: ${result.sentCount} Empfänger${result.failedCount > 0 ? `, ${result.failedCount} fehlgeschlagen` : ''}`
          )
        } else {
          toast.success('Push-Kampagne geplant')
        }
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Veröffentlichen</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{templateName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {(['channel', 'config', 'confirm'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <span className={step === s ? 'text-violet-600 font-semibold' : ''}>
                {i + 1}. {s === 'channel' ? 'Kanal' : s === 'config' ? 'Konfiguration' : 'Bestätigung'}
              </span>
              {i < 2 && <ChevronRight className="w-3 h-3" />}
            </React.Fragment>
          ))}
        </div>

        <div className="border-t pt-4">
          {/* ─── Step 1: Channel ─────────────────────────────────────────── */}
          {step === 'channel' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChannelSelect('inapp')}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-violet-500 hover:bg-violet-50/50 transition-all text-left"
              >
                <div className="p-3 rounded-full bg-violet-100">
                  <Megaphone className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">In-App Banner / Popup</p>
                  <p className="text-xs text-muted-foreground mt-0.5">In der App anzeigen</p>
                </div>
              </button>

              <button
                onClick={() => handleChannelSelect('push')}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-violet-500 hover:bg-violet-50/50 transition-all text-left"
              >
                <div className="p-3 rounded-full bg-blue-100">
                  <BellRing className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Push-Benachrichtigung</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Außerhalb der App</p>
                </div>
              </button>
            </div>
          )}

          {/* ─── Step 2: Config ───────────────────────────────────────────── */}
          {step === 'config' && channel === 'inapp' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Segment *</Label>
                {loadingSegments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lade Segmente...
                  </div>
                ) : (
                  <Select value={inappSegmentId} onValueChange={setInappSegmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Segment wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Anzeigeort</Label>
                  <Select value={inappDisplayPlace} onValueChange={setInappDisplayPlace}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menu">Menü</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Anzeigetyp</Label>
                  <Select value={inappDisplayType} onValueChange={setInappDisplayType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANNER">Banner</SelectItem>
                      <SelectItem value="POPUP">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Startdatum</Label>
                  <Input type="date" value={inappStartDate} onChange={(e) => setInappStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Enddatum (optional)</Label>
                  <Input type="date" value={inappEndDate} onChange={(e) => setInappEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 'config' && channel === 'push' && (
            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                Hinweis: Push-Versand erfordert Browser-Benachrichtigungserlaubnis der Nutzer. Nutzer ohne Erlaubnis werden ausgeschlossen.
              </div>

              <div className="space-y-1.5">
                <Label>Segment *</Label>
                {loadingSegments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lade Segmente...
                  </div>
                ) : (
                  <Select value={pushSegmentId} onValueChange={setPushSegmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Segment wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Titel * <span className="text-muted-foreground font-normal">({pushTitle.length}/65)</span></Label>
                <Input
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value.slice(0, 65))}
                  placeholder="Push-Titel..."
                  maxLength={65}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Nachricht * <span className="text-muted-foreground font-normal">({pushBody.length}/200)</span></Label>
                <textarea
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value.slice(0, 200))}
                  placeholder="Push-Nachricht..."
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Deep-Link (optional)</Label>
                <Input
                  value={pushDeepLink}
                  onChange={(e) => setPushDeepLink(e.target.value)}
                  placeholder="z.B. /wallet oder /menu"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Versandzeitpunkt (optional – leer = sofort)</Label>
                <Input
                  type="datetime-local"
                  value={pushScheduledAt}
                  onChange={(e) => setPushScheduledAt(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ─── Step 3: Confirm ─────────────────────────────────────────── */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
                <p><span className="font-medium">Kanal:</span> {channel === 'inapp' ? 'In-App Banner / Popup' : 'Push-Benachrichtigung'}</p>
                <p><span className="font-medium">Template:</span> {templateName}</p>
                {channel === 'inapp' && (
                  <>
                    <p><span className="font-medium">Segment:</span> {segments.find(s => s.id === inappSegmentId)?.name ?? inappSegmentId}</p>
                    <p><span className="font-medium">Anzeigeort:</span> {inappDisplayPlace}</p>
                    <p><span className="font-medium">Typ:</span> {inappDisplayType}</p>
                    {inappStartDate && <p><span className="font-medium">Start:</span> {inappStartDate}</p>}
                    {inappEndDate && <p><span className="font-medium">Ende:</span> {inappEndDate}</p>}
                  </>
                )}
                {channel === 'push' && (
                  <>
                    <p><span className="font-medium">Segment:</span> {segments.find(s => s.id === pushSegmentId)?.name ?? pushSegmentId}</p>
                    <p><span className="font-medium">Titel:</span> {pushTitle}</p>
                    <p><span className="font-medium">Nachricht:</span> {pushBody}</p>
                    {pushDeepLink && <p><span className="font-medium">Deep-Link:</span> {pushDeepLink}</p>}
                    <p><span className="font-medium">Versand:</span> {pushScheduledAt ? new Date(pushScheduledAt).toLocaleString('de-DE') : 'Sofort'}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'channel' && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Zurück
            </Button>

            {step === 'config' && (
              <Button size="sm" onClick={handleNext} disabled={!canAdvanceFromConfig()} className="gap-1">
                Weiter <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {step === 'confirm' && (
              <Button size="sm" onClick={handlePublish} disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {channel === 'push' && !pushScheduledAt ? 'Jetzt senden' : 'Veröffentlichen'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
