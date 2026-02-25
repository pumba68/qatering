'use client'

import React from 'react'
import { toast } from 'sonner'
import { Loader2, Send, Megaphone, Mail, ChevronRight, ChevronLeft } from 'lucide-react'
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

type Channel = 'email' | 'inapp'
type Step = 'config' | 'confirm'

interface Segment {
  id: string
  name: string
}

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  templateType: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateType,
}: PublishDialogProps) {
  const channel: Channel = templateType === 'EMAIL' ? 'email' : 'inapp'

  const [step, setStep] = React.useState<Step>('config')
  const [segments, setSegments] = React.useState<Segment[]>([])
  const [loadingSegments, setLoadingSegments] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // InApp config
  const [inappSegmentId, setInappSegmentId] = React.useState('')
  const [inappDisplayPlace, setInappDisplayPlace] = React.useState<string>('menu')
  const [inappDisplayType, setInappDisplayType] = React.useState<string>('BANNER')
  const [inappStartDate, setInappStartDate] = React.useState('')
  const [inappEndDate, setInappEndDate] = React.useState('')

  // Email campaign config
  const [emailSegmentId, setEmailSegmentId] = React.useState('')
  const [emailScheduledAt, setEmailScheduledAt] = React.useState('')

  // Load segments + reset on open/close
  React.useEffect(() => {
    if (!open) {
      setStep('config')
      setInappSegmentId('')
      setInappDisplayPlace('menu')
      setInappDisplayType('BANNER')
      setInappStartDate('')
      setInappEndDate('')
      setEmailSegmentId('')
      setEmailScheduledAt('')
      return
    }
    setLoadingSegments(true)
    fetch('/api/admin/segments')
      .then((r) => r.json())
      .then((data: Segment[]) => setSegments(Array.isArray(data) ? data : []))
      .catch(() => setSegments([]))
      .finally(() => setLoadingSegments(false))
  }, [open])

  const handleBack = () => setStep('config')
  const handleNext = () => setStep('confirm')

  const canAdvance = () => {
    if (channel === 'inapp') return !!inappSegmentId
    if (channel === 'email') return !!emailSegmentId
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
      } else if (channel === 'email') {
        const res = await fetch('/api/admin/marketing/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            segmentId: emailSegmentId,
            scheduledAt: emailScheduledAt || null,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Fehler beim Erstellen der Kampagne')
        }
        toast.success(
          emailScheduledAt ? 'E-Mail-Kampagne geplant' : 'E-Mail-Kampagne erstellt – bereit zum Senden'
        )
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  const channelLabel = channel === 'email' ? 'E-Mail-Kampagne' : 'In-App Banner / Popup'
  const ChannelIcon = channel === 'email' ? Mail : Megaphone

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon className="w-4 h-4 text-violet-600" />
            {channelLabel} veröffentlichen
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{templateName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {(['config', 'confirm'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <span className={step === s ? 'text-violet-600 font-semibold' : ''}>
                {i + 1}. {s === 'config' ? 'Konfiguration' : 'Bestätigung'}
              </span>
              {i < 1 && <ChevronRight className="w-3 h-3" />}
            </React.Fragment>
          ))}
        </div>

        <div className="border-t pt-4">
          {/* ─── Step 1: Config ─────────────────────────────────────────── */}
          {step === 'config' && channel === 'inapp' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Segment *</Label>
                {loadingSegments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lade Segmente…
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

          {step === 'config' && channel === 'email' && (
            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                Eine E-Mail-Kampagne wird mit dieser Vorlage erstellt und kann direkt im Kampagnen-Bereich verwaltet und versendet werden.
              </div>

              <div className="space-y-1.5">
                <Label>Segment *</Label>
                {loadingSegments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lade Segmente…
                  </div>
                ) : (
                  <Select value={emailSegmentId} onValueChange={setEmailSegmentId}>
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
                <Label>Versandzeitpunkt (optional – leer = Entwurf)</Label>
                <Input
                  type="datetime-local"
                  value={emailScheduledAt}
                  onChange={(e) => setEmailScheduledAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leer lassen, um die Kampagne erst manuell im Kampagnen-Bereich zu senden.
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Confirm ──────────────────────────────────────────── */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
                <p><span className="font-medium">Kanal:</span> {channelLabel}</p>
                <p><span className="font-medium">Vorlage:</span> {templateName}</p>
                {channel === 'inapp' && (
                  <>
                    <p><span className="font-medium">Segment:</span> {segments.find(s => s.id === inappSegmentId)?.name ?? inappSegmentId}</p>
                    <p><span className="font-medium">Anzeigeort:</span> {inappDisplayPlace}</p>
                    <p><span className="font-medium">Typ:</span> {inappDisplayType}</p>
                    {inappStartDate && <p><span className="font-medium">Start:</span> {inappStartDate}</p>}
                    {inappEndDate && <p><span className="font-medium">Ende:</span> {inappEndDate}</p>}
                  </>
                )}
                {channel === 'email' && (
                  <>
                    <p><span className="font-medium">Segment:</span> {segments.find(s => s.id === emailSegmentId)?.name ?? emailSegmentId}</p>
                    <p><span className="font-medium">Versand:</span> {emailScheduledAt ? new Date(emailScheduledAt).toLocaleString('de-DE') : 'Manuell (Entwurf)'}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          {step === 'confirm' ? (
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Zurück
            </Button>
          ) : (
            <div />
          )}

          {step === 'config' && (
            <Button size="sm" onClick={handleNext} disabled={!canAdvance()} className="gap-1">
              Weiter <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {step === 'confirm' && (
            <Button size="sm" onClick={handlePublish} disabled={submitting} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Veröffentlichen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
