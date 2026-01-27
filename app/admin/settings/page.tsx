'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const DAYS = [
  { value: 0, label: 'Sonntag', short: 'So' },
  { value: 1, label: 'Montag', short: 'Mo' },
  { value: 2, label: 'Dienstag', short: 'Di' },
  { value: 3, label: 'Mittwoch', short: 'Mi' },
  { value: 4, label: 'Donnerstag', short: 'Do' },
  { value: 5, label: 'Freitag', short: 'Fr' },
  { value: 6, label: 'Samstag', short: 'Sa' },
]

export default function SettingsPage() {
  const locationId = 'demo-location-1'
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/settings?locationId=${locationId}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Settings')
      const data = await response.json()
      setWorkingDays(data.workingDays || [1, 2, 3, 4, 5])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          workingDays,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      alert('Einstellungen wurden gespeichert!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (dayValue: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12 text-muted-foreground">Lade Einstellungen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Einstellungen</h1>
          <p className="text-muted-foreground">
            Konfigurieren Sie die Werktage für Ihr Menü
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Werktage</CardTitle>
            <CardDescription>
              Wählen Sie die Tage aus, an denen das Menü angezeigt werden soll.
              Nicht ausgewählte Tage werden im Kundenmenü nicht angezeigt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Verfügbare Tage</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS.map((day) => {
                  const isSelected = workingDays.includes(day.value)
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => toggleDay(day.value)}
                      className="h-auto py-4 flex flex-col gap-1"
                    >
                      <span className="text-lg font-semibold">{day.short}</span>
                      <span className="text-xs opacity-80">{day.label}</span>
                    </Button>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Speichert...' : 'Einstellungen speichern'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}