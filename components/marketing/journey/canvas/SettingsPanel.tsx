'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Journey } from '../journey-types'

interface SettingsPanelProps {
  journey: Partial<Journey>
  onUpdate: (updates: Partial<Journey>) => void
  onClose: () => void
}

export function SettingsPanel({ journey, onUpdate, onClose }: SettingsPanelProps) {
  const [reEntryType, setReEntryType] = useState<string>(() => {
    if (!journey.reEntryPolicy || journey.reEntryPolicy === 'NEVER') return 'NEVER'
    if (journey.reEntryPolicy === 'ALWAYS') return 'ALWAYS'
    return 'AFTER_DAYS'
  })
  const [reEntryDays, setReEntryDays] = useState<number>(() => {
    const m = journey.reEntryPolicy?.match(/AFTER_DAYS:(\d+)/)
    return m ? parseInt(m[1]) : 30
  })

  const [exitRules, setExitRules] = useState<Record<string, unknown>[]>(
    () => (journey.exitRules as Record<string, unknown>[] | undefined) ?? []
  )

  const [conversionEventType, setConversionEventType] = useState<string>(
    () => (journey.conversionGoal as { eventType?: string } | undefined)?.eventType ?? 'order.first'
  )
  const [conversionWindowDays, setConversionWindowDays] = useState<number>(
    () => (journey.conversionGoal as { windowDays?: number } | undefined)?.windowDays ?? 30
  )
  const [hasConversionGoal, setHasConversionGoal] = useState<boolean>(
    () => Boolean(journey.conversionGoal)
  )

  const getReEntryPolicy = () => {
    if (reEntryType === 'NEVER') return 'NEVER'
    if (reEntryType === 'ALWAYS') return 'ALWAYS'
    return `AFTER_DAYS:${reEntryDays}`
  }

  const handleSave = () => {
    onUpdate({
      reEntryPolicy: getReEntryPolicy(),
      exitRules: exitRules.length > 0 ? exitRules : null,
      conversionGoal: hasConversionGoal
        ? { eventType: conversionEventType, windowDays: conversionWindowDays }
        : null,
      startDate: journey.startDate,
      endDate: journey.endDate,
    })
    onClose()
  }

  const addExitRule = () => {
    setExitRules((prev) => [
      ...prev,
      { type: 'EVENT', config: { eventType: 'order.first' } },
    ])
  }

  const removeExitRule = (idx: number) => {
    setExitRules((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateExitRule = (idx: number, key: string, value: unknown) => {
    setExitRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    )
  }

  return (
    <div className="absolute right-0 top-0 w-80 bg-white border-l shadow-xl z-30 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-800">Journey-Einstellungen</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Laufzeit */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Laufzeit</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Startdatum (optional)</Label>
              <Input
                type="datetime-local"
                value={journey.startDate ? new Date(journey.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => onUpdate({ startDate: e.target.value || null })}
                className="h-8 text-xs"
              />
              <p className="text-xs text-gray-400">Leer = sofort bei Aktivierung</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Enddatum (optional)</Label>
              <Input
                type="datetime-local"
                value={journey.endDate ? new Date(journey.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => onUpdate({ endDate: e.target.value || null })}
                className="h-8 text-xs"
              />
              <p className="text-xs text-gray-400">Leer = kein automatisches Ende</p>
            </div>
          </div>
        </section>

        {/* Re-Entry */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Re-Entry</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nutzer darf Journey erneut betreten</Label>
              <Select value={reEntryType} onValueChange={setReEntryType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEVER">Nie</SelectItem>
                  <SelectItem value="AFTER_DAYS">Nach X Tagen</SelectItem>
                  <SelectItem value="ALWAYS">Immer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reEntryType === 'AFTER_DAYS' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Erneut betreten nach (Tagen)</Label>
                <Input
                  type="number"
                  min={1}
                  value={reEntryDays}
                  onChange={(e) => setReEntryDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        </section>

        {/* Conversion Goal */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Conversion Goal</p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasGoal"
                checked={hasConversionGoal}
                onChange={(e) => setHasConversionGoal(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="hasGoal" className="text-xs cursor-pointer">Conversion-Ziel definieren</Label>
            </div>
            {hasConversionGoal && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ziel-Event</Label>
                  <Select value={conversionEventType} onValueChange={setConversionEventType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order.first">Erste Bestellung</SelectItem>
                      <SelectItem value="order.any">Beliebige Bestellung</SelectItem>
                      <SelectItem value="wallet.topup">Wallet aufgeladen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Zeitfenster (Tage)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={conversionWindowDays}
                    onChange={(e) => setConversionWindowDays(Math.max(1, parseInt(e.target.value) || 30))}
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Exit Rules */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Exit-Regeln</p>
          <div className="space-y-2">
            {exitRules.map((rule, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">Regel {idx + 1}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeExitRule(idx)}
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
                <Select
                  value={(rule.type as string) ?? 'EVENT'}
                  onValueChange={(v) => updateExitRule(idx, 'type', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVENT">Bei Event</SelectItem>
                    <SelectItem value="SEGMENT_EXIT">Bei Segment-Austritt</SelectItem>
                    <SelectItem value="CONVERSION">Bei Conversion</SelectItem>
                  </SelectContent>
                </Select>
                {rule.type === 'EVENT' && (
                  <Select
                    value={(rule.config as { eventType?: string })?.eventType ?? 'order.first'}
                    onValueChange={(v) => updateExitRule(idx, 'config', { eventType: v })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order.first">Erste Bestellung</SelectItem>
                      <SelectItem value="order.any">Beliebige Bestellung</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={addExitRule}
            >
              <Plus className="w-3 h-3 mr-1" />
              Regel hinzufügen
            </Button>
          </div>
        </section>
      </div>

      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full h-9">
          Einstellungen speichern
        </Button>
      </div>
    </div>
  )
}
