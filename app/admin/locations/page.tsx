'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAdminLocation } from '@/components/admin/LocationContext'

interface LocationItem {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  openingHours: unknown
  workingDays: number[]
  isActive: boolean
}

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
}

export default function AdminLocationsPage() {
  const { refetch: refetchContext } = useAdminLocation()
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/locations?includeInactive=true')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : 'Standorte konnten nicht geladen werden.'
        throw new Error(msg)
      }
      setLocations(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSaveError(null)
    setSheetOpen(true)
  }

  const openEdit = (loc: LocationItem) => {
    setEditingId(loc.id)
    setForm({
      name: loc.name,
      address: loc.address ?? '',
      phone: loc.phone ?? '',
      email: loc.email ?? '',
      isActive: loc.isActive,
    })
    setSaveError(null)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setSaveError(null)
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setSaveError('Name ist Pflichtfeld.')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSaveError('Ungültiges E-Mail-Format.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/locations/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            isActive: form.isActive,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Speichern fehlgeschlagen.')
        }
      } else {
        const res = await fetch('/api/admin/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            isActive: form.isActive,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Anlegen fehlgeschlagen.')
        }
      }
      await fetchLocations()
      refetchContext()
      closeSheet()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Standorte</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Lade Standorte…</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Standorte</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchLocations}>
              Erneut laden
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Standorte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Standorte verwalten und anlegen.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Neue Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">Noch keine Standorte.</p>
            <p className="text-sm text-muted-foreground mb-4">Erstellen Sie den ersten Standort.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className={!loc.isActive ? 'opacity-75' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{loc.name}</CardTitle>
                  {!loc.isActive && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inaktiv
                    </span>
                  )}
                </div>
                {loc.address && (
                  <CardDescription className="text-sm">{loc.address}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(loc)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Standort bearbeiten' : 'Neuer Standort'}</SheetTitle>
            <SheetDescription>
              {editingId ? 'Daten des Standorts anpassen.' : 'Neuen Standort anlegen.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="loc-name">Name *</Label>
              <Input
                id="loc-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Kantine Hauptgebäude"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-address">Adresse</Label>
              <Input
                id="loc-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Straße, PLZ Ort"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-phone">Telefon</Label>
              <Input
                id="loc-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+49 …"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-email">E-Mail</Label>
              <Input
                id="loc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="kantine@example.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loc-active"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="loc-active" className="cursor-pointer">Aktiv</Label>
            </div>
            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={closeSheet} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
