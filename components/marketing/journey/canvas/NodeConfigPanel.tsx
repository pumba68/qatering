'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  JourneyNodeType,
  StartNodeConfig,
  DelayNodeConfig,
  EmailNodeConfig,
  InAppNodeConfig,
  PushNodeConfig,
  BranchNodeConfig,
  IncentiveNodeConfig,
  EndNodeConfig,
} from '../journey-types'
import { EVENT_TYPES } from '../journey-types'

interface Template {
  id: string
  name: string
  type: string
}

interface NodeConfigPanelProps {
  nodeId: string
  nodeType: JourneyNodeType
  config: Record<string, unknown>
  onUpdate: (nodeId: string, config: Record<string, unknown>) => void
  onClose: () => void
}

export function NodeConfigPanel({ nodeId, nodeType, config, onUpdate, onClose }: NodeConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(config)
  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    setLocalConfig(config)
  }, [nodeId, config])

  useEffect(() => {
    if (['email', 'inapp', 'push'].includes(nodeType)) {
      const typeMap: Record<string, string> = {
        email: 'EMAIL',
        inapp: 'IN_APP_BANNER',
        push: 'PUSH',
      }
      fetch(`/api/admin/marketing/templates?type=${typeMap[nodeType]}&status=ACTIVE`)
        .then((r) => r.json())
        .then((data: Template[]) => setTemplates(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
    if (nodeType === 'branch' || nodeType === 'start') {
      fetch('/api/admin/segments')
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.segments ?? []
          setSegments(list)
        })
        .catch(() => {})
    }
  }, [nodeType])

  const set = (key: string, value: unknown) => {
    const updated = { ...localConfig, [key]: value }
    setLocalConfig(updated)
    onUpdate(nodeId, updated)
  }

  const setMany = (partial: Record<string, unknown>) => {
    const updated = { ...localConfig, ...partial }
    setLocalConfig(updated)
    onUpdate(nodeId, updated)
  }

  const NODE_TITLES: Record<JourneyNodeType, string> = {
    start: 'Start-Node konfigurieren',
    delay: 'Wartezeit konfigurieren',
    email: 'E-Mail konfigurieren',
    inapp: 'In-App Nachricht konfigurieren',
    push: 'Push Notification konfigurieren',
    branch: 'Bedingung konfigurieren',
    incentive: 'Incentive konfigurieren',
    end: 'End-Node',
  }

  return (
    <div className="w-72 flex-shrink-0 border-l bg-white flex flex-col h-full shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-800">{NODE_TITLES[nodeType]}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Start Node ─────────────────── */}
        {nodeType === 'start' && (
          <StartConfig config={localConfig as unknown as StartNodeConfig} set={set} setMany={setMany} segments={segments} />
        )}

        {/* ── Delay Node ─────────────────── */}
        {nodeType === 'delay' && (
          <DelayConfig config={localConfig as unknown as DelayNodeConfig} set={set} />
        )}

        {/* ── Email / InApp / Push ───────── */}
        {(nodeType === 'email' || nodeType === 'inapp' || nodeType === 'push') && (
          <ChannelConfig
            config={localConfig as unknown as EmailNodeConfig | InAppNodeConfig | PushNodeConfig}
            templates={templates}
            nodeType={nodeType}
            set={set}
            setMany={setMany}
          />
        )}

        {/* ── Branch Node ────────────────── */}
        {nodeType === 'branch' && (
          <BranchConfig
            config={localConfig as unknown as BranchNodeConfig}
            segments={segments}
            set={set}
            setMany={setMany}
          />
        )}

        {/* ── Incentive Node ─────────────── */}
        {nodeType === 'incentive' && (
          <IncentiveConfig config={localConfig as unknown as IncentiveNodeConfig} set={set} />
        )}

        {/* ── End Node ───────────────────── */}
        {nodeType === 'end' && (
          <EndConfig config={localConfig as unknown as EndNodeConfig} set={set} />
        )}
      </div>
    </div>
  )
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function StartConfig({
  config,
  set,
  setMany,
  segments,
}: {
  config: StartNodeConfig
  set: (k: string, v: unknown) => void
  setMany: (partial: Record<string, unknown>) => void
  segments: { id: string; name: string }[]
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Trigger-Typ</Label>
        <Select value={config.triggerType ?? 'EVENT'} onValueChange={(v) => set('triggerType', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EVENT">Event-basiert</SelectItem>
            <SelectItem value="SEGMENT_ENTRY">Segment-Eintritt</SelectItem>
            <SelectItem value="DATE_BASED">Datum-basiert</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.triggerType === 'EVENT' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Event</Label>
          <Select value={config.eventType ?? 'user.registered'} onValueChange={(v) => set('eventType', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {config.triggerType === 'SEGMENT_ENTRY' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Segment</Label>
          <Select
            value={config.segmentId ?? ''}
            onValueChange={(v) => {
              const seg = segments.find((s) => s.id === v)
              setMany({ segmentId: v, segmentName: seg?.name ?? '' })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Segment wählen..." />
            </SelectTrigger>
            <SelectContent>
              {segments.length === 0 ? (
                <div className="px-2 py-4 text-xs text-gray-400 text-center">Keine Segmente vorhanden</div>
              ) : (
                segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!config.segmentId && (
            <p className="text-xs text-amber-600">Bitte ein Segment auswählen.</p>
          )}
        </div>
      )}
      {config.triggerType === 'DATE_BASED' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Datumsfeld</Label>
          <Select value={config.dateField ?? 'user.birthday'} onValueChange={(v) => set('dateField', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user.birthday">Geburtstag</SelectItem>
              <SelectItem value="user.registration_anniversary">Registrierungsjubiläum</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1.5">
            <Label className="text-xs">Tage vorher</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={config.daysBefore ?? 0}
              onChange={(e) => set('daysBefore', parseInt(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}
    </>
  )
}

function DelayConfig({ config, set }: { config: DelayNodeConfig; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <div className="flex gap-2">
        <div className="space-y-1.5 flex-1">
          <Label className="text-xs">Dauer</Label>
          <Input
            type="number"
            min={1}
            value={config.amount ?? 1}
            onChange={(e) => set('amount', Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5 w-28">
          <Label className="text-xs">Einheit</Label>
          <Select value={config.unit ?? 'days'} onValueChange={(v) => set('unit', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minuten</SelectItem>
              <SelectItem value="hours">Stunden</SelectItem>
              <SelectItem value="days">Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}

function ChannelConfig({
  config,
  templates,
  nodeType,
  set,
  setMany,
}: {
  config: EmailNodeConfig | InAppNodeConfig | PushNodeConfig
  templates: Template[]
  nodeType: string
  set: (k: string, v: unknown) => void
  setMany: (partial: Record<string, unknown>) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Template</Label>
        {templates.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Keine Templates gefunden</p>
        ) : (
          <Select
            value={config.templateId ?? ''}
            onValueChange={(v) => {
              const tpl = templates.find((t) => t.id === v)
              setMany({ templateId: v, templateName: tpl?.name ?? '' })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Template auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {nodeType === 'email' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Betreff überschreiben (optional)</Label>
            <Input
              value={(config as EmailNodeConfig).subjectOverride ?? ''}
              onChange={(e) => set('subjectOverride', e.target.value || undefined)}
              placeholder="Überschreibt Template-Betreff"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Absendername überschreiben (optional)</Label>
            <Input
              value={(config as EmailNodeConfig).senderNameOverride ?? ''}
              onChange={(e) => set('senderNameOverride', e.target.value || undefined)}
              placeholder="Überschreibt Template-Absender"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Bei Sendefehler</Label>
        <Select
          value={(config as EmailNodeConfig).onFailure ?? 'continue'}
          onValueChange={(v) => set('onFailure', v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="continue">Journey fortführen</SelectItem>
            <SelectItem value="stop">Participant stoppen</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function BranchConfig({
  config,
  segments,
  set,
  setMany,
}: {
  config: BranchNodeConfig
  segments: { id: string; name: string }[]
  set: (k: string, v: unknown) => void
  setMany: (partial: Record<string, unknown>) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Bedingungstyp</Label>
        <Select
          value={config.conditionType ?? 'event'}
          onValueChange={(v) => set('conditionType', v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">Event prüfen</SelectItem>
            <SelectItem value="segment">Segment-Zugehörigkeit</SelectItem>
            <SelectItem value="attribute">Nutzer-Attribut</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.conditionType === 'event' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Event</Label>
            <Select
              value={config.eventType ?? 'order.first'}
              onValueChange={(v) => set('eventType', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Zeitfenster (Tage)</Label>
            <Input
              type="number"
              min={1}
              value={config.windowDays ?? 30}
              onChange={(e) => set('windowDays', parseInt(e.target.value) || 30)}
              className="h-8 text-xs"
            />
          </div>
        </>
      )}

      {config.conditionType === 'segment' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Segment</Label>
          <Select
            value={config.segmentId ?? ''}
            onValueChange={(v) => {
              const seg = segments.find((s) => s.id === v)
              setMany({ segmentId: v, segmentName: seg?.name ?? '' })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Segment wählen..." />
            </SelectTrigger>
            <SelectContent>
              {segments.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {config.conditionType === 'attribute' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Feld</Label>
            <Input
              value={config.field ?? ''}
              onChange={(e) => set('field', e.target.value)}
              placeholder="z.B. marketingEmailConsent"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Operator</Label>
            <Select
              value={config.operator ?? 'eq'}
              onValueChange={(v) => set('operator', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Gleich (=)</SelectItem>
                <SelectItem value="neq">Ungleich (≠)</SelectItem>
                <SelectItem value="gt">Größer als (&gt;)</SelectItem>
                <SelectItem value="lt">Kleiner als (&lt;)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Wert</Label>
            <Input
              value={String(config.value ?? '')}
              onChange={(e) => set('value', e.target.value)}
              placeholder="Vergleichswert"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </>
  )
}

function IncentiveConfig({
  config,
  set,
}: {
  config: IncentiveNodeConfig
  set: (k: string, v: unknown) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Incentive-Typ</Label>
        <Select
          value={config.incentiveType ?? 'wallet_credit'}
          onValueChange={(v) => set('incentiveType', v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wallet_credit">Wallet-Guthaben</SelectItem>
            <SelectItem value="coupon">Coupon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.incentiveType === 'wallet_credit' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Betrag (€)</Label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={config.walletAmount ?? 5}
              onChange={(e) => set('walletAmount', parseFloat(e.target.value) || 5)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notiz (optional)</Label>
            <Input
              value={config.walletNote ?? ''}
              onChange={(e) => set('walletNote', e.target.value)}
              placeholder="z.B. Journey-Bonus"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}

      {config.incentiveType === 'coupon' && (
        <p className="text-xs text-gray-400">
          Coupon-Auswahl folgt in der nächsten Iteration.
        </p>
      )}
    </>
  )
}

function EndConfig({ config, set }: { config: EndNodeConfig; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Label (optional)</Label>
      <Input
        value={config.label ?? ''}
        onChange={(e) => set('label', e.target.value)}
        placeholder="z.B. Konvertiert"
        className="h-8 text-xs"
      />
    </div>
  )
}
