'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare, Gift, Plus, Pencil, Trash2, Send, Wallet, Ticket, Play, ChevronRight, X, Eye, MousePointerClick, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MARKETING_SLOT_IDS, DISPLAY_TYPE_LABELS } from '@/lib/marketing-slots'

// ── Email campaign types ──────────────────────────────────────────────────────

type EmailTemplate = { id: string; name: string; subjectLine: string | null; senderName: string | null; preheaderText: string | null }
type EmailCampaign = {
  id: string
  subjectLine: string
  senderName: string | null
  status: string
  totalRecipients: number
  sentCount: number
  failedCount: number
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  template: { id: string; name: string } | null
  segment: { id: string; name: string } | null
  _count: { logs: number }
}

const EMAIL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  SCHEDULED: 'Geplant',
  SENDING: 'Wird versendet',
  SENT: 'Versendet',
  CANCELLED: 'Storniert',
  FAILED: 'Fehlgeschlagen',
}

const EMAIL_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-100 text-red-700',
}

type Segment = { id: string; name: string }
type CouponOpt = { id: string; code: string; name: string; type: string } | null
type Incentive = {
  id: string
  name: string | null
  incentiveType: string
  segment: { id: string; name: string }
  coupon: CouponOpt
  walletAmount: string | null
  personaliseCoupon: boolean
  isActive: boolean
  _count: { grants: number }
}
type InAppMessage = {
  id: string
  title: string | null
  body: string
  linkUrl: string | null
  displayPlace: string
  displayType?: string
  slotId?: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  segment: Segment
}

const displayPlaceLabels: Record<string, string> = {
  menu: 'Menü',
  wallet: 'Guthaben',
  dashboard: 'Dashboard',
}

export default function CampaignsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [messages, setMessages] = useState<InAppMessage[]>([])
  const [loadingSegments, setLoadingSegments] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [messageSheetOpen, setMessageSheetOpen] = useState(false)

  // ── Email Campaign State ───────────────────────────────────────────────────
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [campaignStep, setCampaignStep] = useState<1 | 2 | 3>(1)
  const [launchForm, setLaunchForm] = useState({
    templateId: '',
    segmentId: '',
    subjectLine: '',
    preheaderText: '',
    senderName: '',
    sendMode: 'now' as 'now' | 'scheduled',
    scheduledAt: '',
  })
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null)
  const [campaignDetail, setCampaignDetail] = useState<(EmailCampaign & { logs?: { email: string; status: string; openedAt: string | null; clickedAt: string | null }[] }) | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [messageForm, setMessageForm] = useState({
    segmentId: '',
    title: '',
    body: '',
    linkUrl: '',
    displayPlace: 'menu' as 'menu' | 'wallet' | 'dashboard',
    displayType: 'BANNER' as 'POPUP' | 'BANNER' | 'SLOT',
    slotId: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const [savingMessage, setSavingMessage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [coupons, setCoupons] = useState<{ id: string; code: string; name: string; type: string }[]>([])
  const [loadingIncentives, setLoadingIncentives] = useState(true)
  const [incentiveSheetOpen, setIncentiveSheetOpen] = useState(false)
  const [editingIncentiveId, setEditingIncentiveId] = useState<string | null>(null)
  const [incentiveForm, setIncentiveForm] = useState({
    segmentId: '',
    name: '',
    incentiveType: 'COUPON' as 'COUPON' | 'WALLET_CREDIT',
    couponId: '',
    personaliseCoupon: false,
    walletAmount: '5',
    maxGrantsPerUser: 1,
    displayChannel: 'BOTH' as 'EMAIL' | 'IN_APP' | 'BOTH',
    isActive: true,
  })
  const [savingIncentive, setSavingIncentive] = useState(false)
  const [grantingId, setGrantingId] = useState<string | null>(null)

  const fetchSegments = useCallback(async () => {
    try {
      setLoadingSegments(true)
      const res = await fetch('/api/admin/segments')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSegments(Array.isArray(data) ? data : [])
    } catch {
      setSegments([])
    } finally {
      setLoadingSegments(false)
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      setLoadingMessages(true)
      const res = await fetch('/api/admin/marketing/in-app-messages?includeInactive=true')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const fetchIncentives = useCallback(async () => {
    try {
      setLoadingIncentives(true)
      const res = await fetch('/api/admin/marketing/incentives')
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setIncentives(Array.isArray(data) ? data : [])
    } catch {
      setIncentives([])
    } finally {
      setLoadingIncentives(false)
    }
  }, [])

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coupons?includeInactive=true')
      const data = await res.json().catch(() => [])
      if (!res.ok) return
      setCoupons(Array.isArray(data) ? data.map((c: { id: string; code: string; name: string; type: string }) => ({ id: c.id, code: c.code, name: c.name, type: c.type })) : [])
    } catch {
      setCoupons([])
    }
  }, [])

  // ── Email Campaign Fetches ─────────────────────────────────────────────────
  const fetchEmailCampaigns = useCallback(async () => {
    try {
      setLoadingCampaigns(true)
      const res = await fetch('/api/admin/marketing/email/campaigns')
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setEmailCampaigns(Array.isArray(data) ? data : [])
    } catch {
      setEmailCampaigns([])
    } finally {
      setLoadingCampaigns(false)
    }
  }, [])

  const fetchEmailTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/marketing/templates?type=EMAIL&status=ACTIVE')
      const data = await res.json().catch(() => [])
      if (!res.ok) return
      setEmailTemplates(Array.isArray(data) ? data : [])
    } catch {
      setEmailTemplates([])
    }
  }, [])

  const fetchCampaignDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/marketing/email/campaigns/${id}`)
      const data = await res.json().catch(() => null)
      if (res.ok) setCampaignDetail(data)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const cancelCampaign = useCallback(async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/admin/marketing/email/campaigns/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      fetchEmailCampaigns()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setCancellingId(null)
    }
  }, [fetchEmailCampaigns])

  const launchCampaign = useCallback(async () => {
    if (!launchForm.templateId || !launchForm.subjectLine.trim()) {
      setLaunchError('Template und Betreff sind erforderlich.')
      return
    }
    setLaunching(true)
    setLaunchError(null)
    try {
      const res = await fetch('/api/admin/marketing/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: launchForm.templateId,
          segmentId: launchForm.segmentId || null,
          subjectLine: launchForm.subjectLine.trim(),
          preheaderText: launchForm.preheaderText.trim() || null,
          senderName: launchForm.senderName.trim() || null,
          scheduledAt: launchForm.sendMode === 'scheduled' && launchForm.scheduledAt ? launchForm.scheduledAt : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler beim Starten')
      setCampaignDialogOpen(false)
      setCampaignStep(1)
      fetchEmailCampaigns()
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLaunching(false)
    }
  }, [launchForm, fetchEmailCampaigns])

  useEffect(() => {
    fetchIncentives()
  }, [fetchIncentives])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  useEffect(() => {
    fetchEmailCampaigns()
    fetchEmailTemplates()
  }, [fetchEmailCampaigns, fetchEmailTemplates])

  useEffect(() => {
    if (detailCampaignId) fetchCampaignDetail(detailCampaignId)
  }, [detailCampaignId, fetchCampaignDetail])

  const openNewIncentive = () => {
    setEditingIncentiveId(null)
    setIncentiveForm({
      segmentId: segments[0]?.id ?? '',
      name: '',
      incentiveType: 'COUPON',
      couponId: coupons[0]?.id ?? '',
      personaliseCoupon: false,
      walletAmount: '5',
      maxGrantsPerUser: 1,
      displayChannel: 'BOTH',
      isActive: true,
    })
    setSaveError(null)
    setIncentiveSheetOpen(true)
  }

  const saveIncentive = async () => {
    if (!incentiveForm.segmentId) {
      setSaveError('Segment ist erforderlich.')
      return
    }
    if (incentiveForm.incentiveType === 'COUPON' && !incentiveForm.couponId) {
      setSaveError('Coupon ist erforderlich.')
      return
    }
    if (incentiveForm.incentiveType === 'WALLET_CREDIT') {
      const amt = parseFloat(incentiveForm.walletAmount)
      if (isNaN(amt) || amt <= 0) {
        setSaveError('Gültiger Betrag erforderlich.')
        return
      }
    }
    setSavingIncentive(true)
    setSaveError(null)
    try {
      const payload = {
        segmentId: incentiveForm.segmentId,
        name: incentiveForm.name.trim() || null,
        incentiveType: incentiveForm.incentiveType,
        couponId: incentiveForm.incentiveType === 'COUPON' ? incentiveForm.couponId : null,
        personaliseCoupon: incentiveForm.personaliseCoupon,
        walletAmount: incentiveForm.incentiveType === 'WALLET_CREDIT' ? parseFloat(incentiveForm.walletAmount) : null,
        maxGrantsPerUser: incentiveForm.maxGrantsPerUser,
        displayChannel: incentiveForm.displayChannel,
        isActive: incentiveForm.isActive,
      }
      const url = editingIncentiveId ? `/api/admin/marketing/incentives/${editingIncentiveId}` : '/api/admin/marketing/incentives'
      const method = editingIncentiveId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIncentiveId ? { ...payload, segmentId: undefined } : payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.')
      setIncentiveSheetOpen(false)
      fetchIncentives()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSavingIncentive(false)
    }
  }

  const grantIncentive = async (id: string) => {
    setGrantingId(id)
    try {
      const res = await fetch(`/api/admin/marketing/incentives/${id}/grant`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Ausspielung fehlgeschlagen.')
      fetchIncentives()
      if (data.granted != null) {
        alert(`${data.granted} Nutzer haben den Incentive erhalten.${data.skipped ? ` ${data.skipped} übersprungen (bereits erhalten).` : ''}`)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setGrantingId(null)
    }
  }

  const deleteIncentive = async (id: string) => {
    if (!confirm('Incentive wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/marketing/incentives/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen.')
      fetchIncentives()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const openNewMessage = () => {
    setEditingMessageId(null)
    setMessageForm({
      segmentId: segments[0]?.id ?? '',
      title: '',
      body: '',
      linkUrl: '',
      displayPlace: 'menu',
      displayType: 'BANNER',
      slotId: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      isActive: true,
    })
    setSaveError(null)
    setMessageSheetOpen(true)
  }

  const openEditMessage = (m: InAppMessage) => {
    setEditingMessageId(m.id)
    setMessageForm({
      segmentId: m.segment.id,
      title: m.title ?? '',
      body: m.body,
      linkUrl: m.linkUrl ?? '',
      displayPlace: (m.displayPlace as 'menu' | 'wallet' | 'dashboard') || 'menu',
      displayType: (m.displayType as 'POPUP' | 'BANNER' | 'SLOT') || 'BANNER',
      slotId: m.slotId ?? '',
      startDate: m.startDate ? new Date(m.startDate).toISOString().slice(0, 16) : '',
      endDate: m.endDate ? new Date(m.endDate).toISOString().slice(0, 16) : '',
      isActive: m.isActive,
    })
    setSaveError(null)
    setMessageSheetOpen(true)
  }

  const saveMessage = async () => {
    const body = messageForm.body.trim()
    if (!body) {
      setSaveError('Inhalt ist erforderlich.')
      return
    }
    if (!messageForm.segmentId) {
      setSaveError('Segment ist erforderlich.')
      return
    }
    setSavingMessage(true)
    setSaveError(null)
    try {
      if (editingMessageId) {
        const res = await fetch(`/api/admin/marketing/in-app-messages/${editingMessageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: messageForm.title.trim() || null,
            body,
            linkUrl: messageForm.linkUrl.trim() || null,
            displayPlace: messageForm.displayPlace,
            displayType: messageForm.displayType,
            slotId: messageForm.slotId.trim() || null,
            startDate: messageForm.startDate ? new Date(messageForm.startDate).toISOString() : undefined,
            endDate: messageForm.endDate ? new Date(messageForm.endDate).toISOString() : null,
            isActive: messageForm.isActive,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.')
      } else {
        const res = await fetch('/api/admin/marketing/in-app-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segmentId: messageForm.segmentId,
            title: messageForm.title.trim() || null,
            body,
            linkUrl: messageForm.linkUrl.trim() || null,
            displayPlace: messageForm.displayPlace,
            displayType: messageForm.displayType,
            slotId: messageForm.slotId.trim() || null,
            startDate: messageForm.startDate ? new Date(messageForm.startDate).toISOString() : undefined,
            endDate: messageForm.endDate ? new Date(messageForm.endDate).toISOString() : null,
            isActive: messageForm.isActive,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Anlegen fehlgeschlagen.')
      }
      await fetchMessages()
      setMessageSheetOpen(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSavingMessage(false)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('In-App-Nachricht wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/marketing/in-app-messages/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen.')
      await fetchMessages()
      if (editingMessageId === id) setMessageSheetOpen(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Kampagnen</h1>
        <p className="text-muted-foreground mt-1">E-Mail versenden, In-App-Nachrichten und Incentives verwalten.</p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="email" className="gap-2 rounded-lg">
            <Mail className="h-4 w-4" />
            E-Mail
          </TabsTrigger>
          <TabsTrigger value="inapp" className="gap-2 rounded-lg">
            <MessageSquare className="h-4 w-4" />
            In-App-Nachrichten
          </TabsTrigger>
          <TabsTrigger value="incentives" className="gap-2 rounded-lg">
            <Gift className="h-4 w-4" />
            Incentives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          {/* Header mit Kampagne starten Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Nur Empfänger mit Marketing-Einwilligung erhalten E-Mails.
            </p>
            <Button
              onClick={() => {
                setCampaignStep(1)
                setLaunchError(null)
                setLaunchForm({
                  templateId: emailTemplates[0]?.id ?? '',
                  segmentId: '',
                  subjectLine: emailTemplates[0]?.subjectLine ?? '',
                  preheaderText: emailTemplates[0]?.preheaderText ?? '',
                  senderName: emailTemplates[0]?.senderName ?? '',
                  sendMode: 'now',
                  scheduledAt: '',
                })
                setCampaignDialogOpen(true)
              }}
              className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Kampagne starten
            </Button>
          </div>

          {/* Kampagnen-Liste */}
          {loadingCampaigns ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </CardContent>
            </Card>
          ) : emailCampaigns.length === 0 ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                Noch keine E-Mail-Kampagnen. Starten Sie Ihre erste Kampagne.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {emailCampaigns.map((c) => {
                const openRate = c.sentCount > 0 ? 0 : 0 // Wird via Logs berechnet
                return (
                  <Card key={c.id} className="rounded-2xl border border-border/50 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{c.subjectLine}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMAIL_STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {EMAIL_STATUS_LABELS[c.status] ?? c.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {c.template?.name ?? 'Kein Template'}
                            {c.segment ? ` · Segment: ${c.segment.name}` : ' · Alle Kunden'}
                            {c.scheduledAt ? ` · Geplant: ${new Date(c.scheduledAt).toLocaleString('de-DE')}` : ''}
                            {c.sentAt ? ` · Versendet: ${new Date(c.sentAt).toLocaleString('de-DE')}` : ''}
                          </p>
                          {(c.status === 'SENT' || c.status === 'FAILED') && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.sentCount}/{c.totalRecipients}</span>
                              <span className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" />{c._count.logs > 0 ? '—' : '0'}</span>
                              <span className="flex items-center gap-1 text-blue-600"><MousePointerClick className="w-3 h-3" />—</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            onClick={() => { setDetailCampaignId(c.id); setCampaignDetail(null) }}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Details
                          </Button>
                          {c.status === 'SCHEDULED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive"
                              onClick={() => cancelCampaign(c.id)}
                              disabled={cancellingId === c.id}
                            >
                              <X className="w-3.5 h-3.5" />
                              Stornieren
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Kampagne starten Dialog (3 Schritte) */}
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Kampagne starten</DialogTitle>
                <DialogDescription>
                  Schritt {campaignStep} von 3 – {['Template wählen', 'Segment & Zeitpunkt', 'Bestätigen'][campaignStep - 1]}
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-1 mb-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${campaignStep >= s ? 'bg-green-600' : 'bg-gray-200'}`} />
                ))}
              </div>

              {/* Schritt 1: Template wählen */}
              {campaignStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>E-Mail-Template *</Label>
                    {emailTemplates.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed border-border">
                        Keine aktiven E-Mail-Templates vorhanden.
                        <a href="/admin/marketing/templates" className="ml-1 text-green-600 underline">Template erstellen →</a>
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {emailTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setLaunchForm((f) => ({
                              ...f,
                              templateId: t.id,
                              subjectLine: t.subjectLine ?? f.subjectLine,
                              preheaderText: t.preheaderText ?? f.preheaderText,
                              senderName: t.senderName ?? f.senderName,
                            }))}
                            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${launchForm.templateId === t.id ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300'}`}
                          >
                            <p className="font-medium">{t.name}</p>
                            {t.subjectLine && <p className="text-xs text-muted-foreground mt-0.5">Betreff: {t.subjectLine}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Betreff-Zeile * <span className="text-gray-400 ml-1">{launchForm.subjectLine.length}/80</span></Label>
                    <Input
                      value={launchForm.subjectLine}
                      onChange={(e) => setLaunchForm((f) => ({ ...f, subjectLine: e.target.value.slice(0, 80) }))}
                      placeholder="Betreff der E-Mail"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Absender-Name</Label>
                    <Input
                      value={launchForm.senderName}
                      onChange={(e) => setLaunchForm((f) => ({ ...f, senderName: e.target.value }))}
                      placeholder="z. B. Demo Kantine"
                    />
                  </div>
                </div>
              )}

              {/* Schritt 2: Segment & Zeitpunkt */}
              {campaignStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ziel-Segment</Label>
                    <select
                      value={launchForm.segmentId}
                      onChange={(e) => setLaunchForm((f) => ({ ...f, segmentId: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="">— Alle Kunden mit Einwilligung —</option>
                      {segments.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Versandzeitpunkt</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLaunchForm((f) => ({ ...f, sendMode: 'now' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${launchForm.sendMode === 'now' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border'}`}
                      >
                        Sofort senden
                      </button>
                      <button
                        type="button"
                        onClick={() => setLaunchForm((f) => ({ ...f, sendMode: 'scheduled' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${launchForm.sendMode === 'scheduled' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border'}`}
                      >
                        Geplant
                      </button>
                    </div>
                    {launchForm.sendMode === 'scheduled' && (
                      <Input
                        type="datetime-local"
                        value={launchForm.scheduledAt}
                        onChange={(e) => setLaunchForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Schritt 3: Zusammenfassung */}
              {campaignStep === 3 && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium">{emailTemplates.find((t) => t.id === launchForm.templateId)?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Betreff:</span>
                      <span className="font-medium truncate max-w-[200px]">{launchForm.subjectLine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zielgruppe:</span>
                      <span className="font-medium">{launchForm.segmentId ? segments.find((s) => s.id === launchForm.segmentId)?.name : 'Alle Kunden'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versand:</span>
                      <span className="font-medium">
                        {launchForm.sendMode === 'now' ? 'Sofort' : launchForm.scheduledAt ? new Date(launchForm.scheduledAt).toLocaleString('de-DE') : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diese Aktion kann nicht rückgängig gemacht werden. Nur Empfänger mit Marketing-Einwilligung erhalten die E-Mail.
                  </p>
                  {launchError && <p className="text-sm text-destructive">{launchError}</p>}
                </div>
              )}

              <DialogFooter className="gap-2">
                {campaignStep > 1 && (
                  <Button variant="outline" onClick={() => setCampaignStep((s) => (s - 1) as 1 | 2 | 3)} disabled={launching}>
                    Zurück
                  </Button>
                )}
                {campaignStep < 3 ? (
                  <Button
                    onClick={() => {
                      if (campaignStep === 1 && !launchForm.templateId) { setLaunchError('Bitte ein Template wählen.'); return }
                      if (campaignStep === 1 && !launchForm.subjectLine.trim()) { setLaunchError('Betreff ist erforderlich.'); return }
                      setLaunchError(null)
                      setCampaignStep((s) => (s + 1) as 1 | 2 | 3)
                    }}
                    className="gap-1"
                  >
                    Weiter <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={launchCampaign}
                    disabled={launching}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {launching ? 'Wird gestartet…' : launchForm.sendMode === 'now' ? 'Kampagne jetzt starten' : 'Kampagne planen'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Kampagnen-Detail Dialog */}
          <Dialog open={!!detailCampaignId} onOpenChange={(o) => { if (!o) setDetailCampaignId(null) }}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Kampagnen-Details</DialogTitle>
              </DialogHeader>
              {loadingDetail ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : campaignDetail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="font-semibold mt-0.5">{EMAIL_STATUS_LABELS[campaignDetail.status] ?? campaignDetail.status}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-muted-foreground text-xs">Empfänger</p>
                      <p className="font-semibold mt-0.5">{campaignDetail.sentCount} / {campaignDetail.totalRecipients}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-muted-foreground text-xs">Versendet am</p>
                      <p className="font-semibold mt-0.5">{campaignDetail.sentAt ? new Date(campaignDetail.sentAt).toLocaleString('de-DE') : '—'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-muted-foreground text-xs">Fehlgeschlagen</p>
                      <p className="font-semibold mt-0.5 text-red-600">{campaignDetail.failedCount}</p>
                    </div>
                  </div>
                  {campaignDetail.logs && campaignDetail.logs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Empfänger-Log</p>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {campaignDetail.logs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-muted/20 gap-2">
                            <span className="truncate text-muted-foreground flex-1">{log.email}</span>
                            <span className={`px-1.5 py-0.5 rounded font-medium ${EMAIL_STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {EMAIL_STATUS_LABELS[log.status] ?? log.status}
                            </span>
                            {log.openedAt && <Eye className="w-3 h-3 text-green-600 shrink-0" />}
                            {log.clickedAt && <MousePointerClick className="w-3 h-3 text-blue-600 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="inapp" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewMessage} className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="h-4 w-4" />
              Neue In-App-Nachricht
            </Button>
          </div>
          {loadingMessages ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </CardContent>
            </Card>
          ) : messages.length === 0 ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                Noch keine In-App-Nachrichten. Erstellen Sie eine neue Nachricht.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {messages.map((m) => (
                <Card key={m.id} className="rounded-2xl border border-border/50 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{m.title || '(ohne Titel)'}</CardTitle>
                      <Badge variant={m.isActive ? 'default' : 'secondary'} className={m.isActive ? 'bg-green-600' : ''}>
                        {m.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Segment: {m.segment.name} · {DISPLAY_TYPE_LABELS[m.displayType ?? 'BANNER'] ?? m.displayType} {m.slotId ? `· ${MARKETING_SLOT_IDS.find((s) => s.id === m.slotId)?.label ?? m.slotId}` : ''} · {displayPlaceLabels[m.displayPlace] ?? m.displayPlace}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.body}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditMessage(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Bearbeiten
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => deleteMessage(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Löschen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incentives" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewIncentive} className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="h-4 w-4" />
              Incentive zuweisen
            </Button>
          </div>
          {loadingIncentives ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </CardContent>
            </Card>
          ) : incentives.length === 0 ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                Noch keine Incentives. Weisen Sie Coupons oder Guthaben einem Segment zu.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {incentives.map((i) => (
                <Card key={i.id} className="rounded-2xl border border-border/50 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{i.name || (i.incentiveType === 'COUPON' ? i.coupon?.name : 'Guthaben-Incentive')}</CardTitle>
                      <Badge variant={i.isActive ? 'default' : 'secondary'} className={i.isActive ? 'bg-green-600' : ''}>
                        {i.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <span>Segment: {i.segment.name}</span>
                      <span>·</span>
                      {i.incentiveType === 'COUPON' ? (
                        <>
                          <Ticket className="h-3.5 w-3.5" />
                          {i.coupon?.code ?? '-'}
                          {i.personaliseCoupon && ' (personalisierter Code)'}
                        </>
                      ) : (
                        <>
                          <Wallet className="h-3.5 w-3.5" />
                          {i.walletAmount != null ? Number(i.walletAmount).toFixed(2) : '0'} €
                        </>
                      )}
                      <span>·</span>
                      <span>{i._count.grants} Ausspielungen</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => grantIncentive(i.id)}
                        disabled={!!grantingId || !i.isActive}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {grantingId === i.id ? 'Wird ausgespielt…' : 'Jetzt ausspielen'}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => deleteIncentive(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Löschen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={messageSheetOpen} onOpenChange={setMessageSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingMessageId ? 'In-App-Nachricht bearbeiten' : 'Neue In-App-Nachricht'}</SheetTitle>
            <SheetDescription>Nachricht für ein Segment und Anzeigeort festlegen.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label>Segment</Label>
              <select
                value={messageForm.segmentId}
                onChange={(e) => setMessageForm((f) => ({ ...f, segmentId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={!!editingMessageId}
              >
                <option value="">— wählen —</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Titel (optional)</Label>
              <Input
                value={messageForm.title}
                onChange={(e) => setMessageForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Kurzer Titel"
              />
            </div>
            <div className="grid gap-2">
              <Label>Inhalt *</Label>
              <Textarea
                value={messageForm.body}
                onChange={(e) => setMessageForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Nachrichtentext"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>Link (optional)</Label>
              <Input
                value={messageForm.linkUrl}
                onChange={(e) => setMessageForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-2">
              <Label>Darstellungstyp</Label>
              <select
                value={messageForm.displayType}
                onChange={(e) => setMessageForm((f) => ({ ...f, displayType: e.target.value as 'POPUP' | 'BANNER' | 'SLOT' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="POPUP">{DISPLAY_TYPE_LABELS.POPUP}</option>
                <option value="BANNER">{DISPLAY_TYPE_LABELS.BANNER}</option>
                <option value="SLOT">{DISPLAY_TYPE_LABELS.SLOT}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Platzierung / Slot</Label>
              <select
                value={messageForm.slotId}
                onChange={(e) => setMessageForm((f) => ({ ...f, slotId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">— Kein Slot / Seite wählen —</option>
                {MARKETING_SLOT_IDS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Bei Popup: z. B. &quot;Popup nach Login&quot;. Bei Slot: gewünschten Platz wählen.</p>
            </div>
            <div className="grid gap-2">
              <Label>Seite (für Banner)</Label>
              <select
                value={messageForm.displayPlace}
                onChange={(e) => setMessageForm((f) => ({ ...f, displayPlace: e.target.value as 'menu' | 'wallet' | 'dashboard' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="menu">Menü</option>
                <option value="wallet">Guthaben</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Startdatum</Label>
              <Input
                type="datetime-local"
                value={messageForm.startDate}
                onChange={(e) => setMessageForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Enddatum (optional)</Label>
              <Input
                type="datetime-local"
                value={messageForm.endDate}
                onChange={(e) => setMessageForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="msg-active"
                checked={messageForm.isActive}
                onChange={(e) => setMessageForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="msg-active">Aktiv</Label>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setMessageSheetOpen(false)} disabled={savingMessage}>Abbrechen</Button>
            <Button onClick={saveMessage} disabled={savingMessage}>{savingMessage ? 'Speichern…' : 'Speichern'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={incentiveSheetOpen} onOpenChange={setIncentiveSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingIncentiveId ? 'Incentive bearbeiten' : 'Incentive zuweisen'}</SheetTitle>
            <SheetDescription>Coupon oder Guthaben einem Segment zuweisen.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label>Segment *</Label>
              <select
                value={incentiveForm.segmentId}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, segmentId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={!!editingIncentiveId}
              >
                <option value="">— wählen —</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Typ *</Label>
              <select
                value={incentiveForm.incentiveType}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, incentiveType: e.target.value as 'COUPON' | 'WALLET_CREDIT' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={!!editingIncentiveId}
              >
                <option value="COUPON">Coupon</option>
                <option value="WALLET_CREDIT">Guthaben</option>
              </select>
            </div>
            {incentiveForm.incentiveType === 'COUPON' && (
              <>
                <div className="grid gap-2">
                  <Label>Coupon *</Label>
                  <select
                    value={incentiveForm.couponId}
                    onChange={(e) => setIncentiveForm((f) => ({ ...f, couponId: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">— wählen —</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inc-personalise"
                    checked={incentiveForm.personaliseCoupon}
                    onChange={(e) => setIncentiveForm((f) => ({ ...f, personaliseCoupon: e.target.checked }))}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="inc-personalise">Personalisierter Code pro User</Label>
                </div>
              </>
            )}
            {incentiveForm.incentiveType === 'WALLET_CREDIT' && (
              <div className="grid gap-2">
                <Label>Betrag (€) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={incentiveForm.walletAmount}
                  onChange={(e) => setIncentiveForm((f) => ({ ...f, walletAmount: e.target.value }))}
                  placeholder="5.00"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Name (optional)</Label>
              <Input
                value={incentiveForm.name}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Stammkunden-Belohnung"
              />
            </div>
            <div className="grid gap-2">
              <Label>Max. Ausspielungen pro User</Label>
              <Input
                type="number"
                min="1"
                value={incentiveForm.maxGrantsPerUser}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, maxGrantsPerUser: parseInt(e.target.value, 10) || 1 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inc-active"
                checked={incentiveForm.isActive}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="inc-active">Aktiv</Label>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIncentiveSheetOpen(false)} disabled={savingIncentive}>Abbrechen</Button>
            <Button onClick={saveIncentive} disabled={savingIncentive}>{savingIncentive ? 'Speichern…' : 'Speichern'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
