'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, MapPin, Clock, Users, AlertCircle,
  Plus, Trash2, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// ─── Typen ───────────────────────────────────────────────────────────────────

interface DayHours {
  active: boolean
  from: string
  to: string
}

type WeekSchedule = Record<number, DayHours>

interface LocationData {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  workingDays: number[]
  openingHours: Record<string, { from: string; to: string }> | null
}

interface StaffMember {
  userId: string
  role: 'KITCHEN_STAFF' | 'LOCATION_ADMIN'
  user: { id: string; name: string | null; email: string; role: string }
}

interface OrgUser {
  id: string
  name: string | null
  email: string
  role: string
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, label: 'Montag', short: 'Mo' },
  { value: 2, label: 'Dienstag', short: 'Di' },
  { value: 3, label: 'Mittwoch', short: 'Mi' },
  { value: 4, label: 'Donnerstag', short: 'Do' },
  { value: 5, label: 'Freitag', short: 'Fr' },
  { value: 6, label: 'Samstag', short: 'Sa' },
  { value: 0, label: 'Sonntag', short: 'So' },
]

const ROLE_LABELS: Record<string, string> = {
  KITCHEN_STAFF: 'Küche',
  LOCATION_ADMIN: 'Standort-Admin',
  CUSTOMER: 'Kunde',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
}

const DEFAULT_FROM = '11:00'
const DEFAULT_TO = '14:00'

function initSchedule(loc: LocationData): WeekSchedule {
  const schedule: WeekSchedule = {}
  for (const day of DAYS) {
    const isActive = loc.workingDays.includes(day.value)
    const saved = loc.openingHours?.[String(day.value)]
    schedule[day.value] = {
      active: isActive,
      from: saved?.from ?? DEFAULT_FROM,
      to: saved?.to ?? DEFAULT_TO,
    }
  }
  return schedule
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // --- globaler Lade-/Fehler-State ---
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // --- Stammdaten ---
  const [location, setLocation] = useState<LocationData | null>(null)
  const [stamm, setStamm] = useState({
    name: '', address: '', phone: '', email: '', isActive: true,
  })
  const [stammSaving, setStammSaving] = useState(false)
  const [stammError, setStammError] = useState<string | null>(null)
  const [stammSuccess, setStammSuccess] = useState(false)

  // --- Werktage ---
  const [schedule, setSchedule] = useState<WeekSchedule>({})
  const [schedSaving, setSchedSaving] = useState(false)
  const [schedError, setSchedError] = useState<string | null>(null)
  const [schedSuccess, setSchedSuccess] = useState(false)

  // --- Mitarbeiter ---
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [staffError, setStaffError] = useState<string | null>(null)

  // --- Nutzer hinzufügen ---
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([])
  const [orgUsersLoading, setOrgUsersLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newRole, setNewRole] = useState<'KITCHEN_STAFF' | 'LOCATION_ADMIN'>('KITCHEN_STAFF')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // ─── Laden ────────────────────────────────────────────────────────────────

  const fetchLocation = useCallback(async () => {
    try {
      setPageLoading(true)
      setPageError(null)
      const res = await fetch(`/api/admin/locations/${id}`)
      if (res.status === 404) { setPageError('Standort nicht gefunden.'); return }
      if (!res.ok) { setPageError('Fehler beim Laden des Standorts.'); return }
      const data: LocationData = await res.json()
      setLocation(data)
      setStamm({
        name: data.name,
        address: data.address ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        isActive: data.isActive,
      })
      setSchedule(initSchedule(data))
    } catch {
      setPageError('Netzwerkfehler beim Laden.')
    } finally {
      setPageLoading(false)
    }
  }, [id])

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true)
      setStaffError(null)
      const res = await fetch(`/api/admin/locations/${id}/users`)
      if (!res.ok) { setStaffError('Mitarbeiter konnten nicht geladen werden.'); return }
      const data = await res.json()
      setStaff(Array.isArray(data) ? data : [])
    } catch {
      setStaffError('Netzwerkfehler.')
    } finally {
      setStaffLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLocation()
    fetchStaff()
  }, [fetchLocation, fetchStaff])

  // ─── Stammdaten speichern ─────────────────────────────────────────────────

  const saveStamm = async () => {
    const name = stamm.name.trim()
    if (!name) { setStammError('Name ist Pflichtfeld.'); return }
    if (stamm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stamm.email)) {
      setStammError('Ungültiges E-Mail-Format.')
      return
    }
    setStammSaving(true)
    setStammError(null)
    setStammSuccess(false)
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: stamm.address.trim() || null,
          phone: stamm.phone.trim() || null,
          email: stamm.email.trim() || null,
          isActive: stamm.isActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Speichern fehlgeschlagen.')
      }
      setStammSuccess(true)
      setTimeout(() => setStammSuccess(false), 3000)
    } catch (e) {
      setStammError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setStammSaving(false)
    }
  }

  // ─── Werktage speichern ───────────────────────────────────────────────────

  const saveSchedule = async () => {
    // Validierung: Bis > Von für alle aktiven Tage
    for (const day of DAYS) {
      const s = schedule[day.value]
      if (!s?.active) continue
      if (s.from >= s.to) {
        setSchedError(`${day.label}: Endzeit muss nach Startzeit liegen.`)
        return
      }
    }
    const workingDays = DAYS.filter((d) => schedule[d.value]?.active).map((d) => d.value)
    const openingHours: Record<string, { from: string; to: string }> = {}
    for (const day of DAYS) {
      if (schedule[day.value]?.active) {
        openingHours[String(day.value)] = {
          from: schedule[day.value].from,
          to: schedule[day.value].to,
        }
      }
    }
    setSchedSaving(true)
    setSchedError(null)
    setSchedSuccess(false)
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingDays, openingHours }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Speichern fehlgeschlagen.')
      }
      setSchedSuccess(true)
      setTimeout(() => setSchedSuccess(false), 3000)
    } catch (e) {
      setSchedError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSchedSaving(false)
    }
  }

  const toggleDay = (dayValue: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        active: !prev[dayValue]?.active,
        from: prev[dayValue]?.from || DEFAULT_FROM,
        to: prev[dayValue]?.to || DEFAULT_TO,
      },
    }))
  }

  const setDayTime = (dayValue: number, field: 'from' | 'to', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], [field]: value },
    }))
  }

  // ─── Mitarbeiter hinzufügen ───────────────────────────────────────────────

  const loadOrgUsers = async () => {
    setOrgUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users?orgOnly=true')
      if (res.ok) {
        const data = await res.json()
        setOrgUsers(Array.isArray(data) ? data : [])
      }
    } finally {
      setOrgUsersLoading(false)
    }
  }

  const openAddForm = () => {
    setShowAddForm(true)
    setSelectedUserId('')
    setNewRole('KITCHEN_STAFF')
    setUserSearch('')
    setAddError(null)
    loadOrgUsers()
  }

  const addStaff = async () => {
    if (!selectedUserId) { setAddError('Bitte einen Nutzer auswählen.'); return }
    setAddSaving(true)
    setAddError(null)
    try {
      const res = await fetch(`/api/admin/locations/${id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: newRole }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Hinzufügen fehlgeschlagen.')
      }
      setShowAddForm(false)
      fetchStaff()
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setAddSaving(false)
    }
  }

  const changeRole = async (userId: string, role: 'KITCHEN_STAFF' | 'LOCATION_ADMIN') => {
    try {
      await fetch(`/api/admin/locations/${id}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      setStaff((prev) => prev.map((s) => s.userId === userId ? { ...s, role } : s))
    } catch {
      // silent – optimistic update already happened
    }
  }

  const removeStaff = async (userId: string) => {
    try {
      await fetch(`/api/admin/locations/${id}/users/${userId}`, { method: 'DELETE' })
      setStaff((prev) => prev.filter((s) => s.userId !== userId))
    } catch {
      fetchStaff()
    }
  }

  // ─── Filtered users ───────────────────────────────────────────────────────

  const assignedIds = new Set(staff.map((s) => s.userId))
  const filteredOrgUsers = orgUsers.filter((u) => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  })

  // ─── Render ───────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="space-y-4">
        <Link href="/admin/locations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Liste
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <p className="text-muted-foreground mb-4">{pageError}</p>
            <Button variant="outline" onClick={fetchLocation}>Erneut laden</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Zurück */}
      <div className="flex items-center gap-2">
        <Link href="/admin/locations">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Standorte
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{location?.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{location?.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Standort-Einstellungen verwalten</p>
      </div>

      {/* ── 1. Stammdaten ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Stammdaten</CardTitle>
          </div>
          <CardDescription>Name, Adresse und Kontaktdaten des Standorts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">Name *</Label>
              <Input
                id="s-name"
                value={stamm.name}
                onChange={(e) => setStamm((p) => ({ ...p, name: e.target.value }))}
                placeholder="z. B. Kantine Hauptgebäude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-address">Adresse</Label>
              <Input
                id="s-address"
                value={stamm.address}
                onChange={(e) => setStamm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Straße, PLZ Ort"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-phone">Telefon</Label>
              <Input
                id="s-phone"
                value={stamm.phone}
                onChange={(e) => setStamm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+49 …"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">E-Mail</Label>
              <Input
                id="s-email"
                type="email"
                value={stamm.email}
                onChange={(e) => setStamm((p) => ({ ...p, email: e.target.value }))}
                placeholder="kantine@example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="s-active"
              checked={stamm.isActive}
              onChange={(e) => setStamm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="s-active" className="cursor-pointer">Standort aktiv</Label>
          </div>

          {stammError && <p className="text-sm text-destructive">{stammError}</p>}
          {stammSuccess && <p className="text-sm text-green-600 dark:text-green-400">Gespeichert ✓</p>}

          <div className="pt-2">
            <Button onClick={saveStamm} disabled={stammSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {stammSaving ? 'Speichern…' : 'Stammdaten speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Werktage & Öffnungszeiten ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Werktage & Öffnungszeiten</CardTitle>
          </div>
          <CardDescription>
            Lege pro Wochentag fest, ob dieser aktiv ist und zu welchen Zeiten die Kantine geöffnet hat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const s = schedule[day.value] ?? { active: false, from: DEFAULT_FROM, to: DEFAULT_TO }
            return (
              <div
                key={day.value}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  s.active ? 'border-border bg-background' : 'border-border/40 bg-muted/30'
                }`}
              >
                {/* Toggle */}
                <input
                  type="checkbox"
                  id={`day-${day.value}`}
                  checked={s.active}
                  onChange={() => toggleDay(day.value)}
                  className="h-4 w-4 rounded border-input accent-primary shrink-0"
                />
                {/* Label */}
                <label
                  htmlFor={`day-${day.value}`}
                  className={`w-24 text-sm font-medium cursor-pointer select-none ${
                    s.active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="sm:hidden">{day.short}</span>
                </label>
                {/* Zeitfelder */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground shrink-0">Von</Label>
                    <input
                      type="time"
                      value={s.from}
                      disabled={!s.active}
                      onChange={(e) => setDayTime(day.value, 'from', e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground shrink-0">Bis</Label>
                    <input
                      type="time"
                      value={s.to}
                      disabled={!s.active}
                      onChange={(e) => setDayTime(day.value, 'to', e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            )
          })}

          {schedError && <p className="text-sm text-destructive pt-1">{schedError}</p>}
          {schedSuccess && <p className="text-sm text-green-600 dark:text-green-400 pt-1">Gespeichert ✓</p>}

          <div className="pt-2">
            <Button onClick={saveSchedule} disabled={schedSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {schedSaving ? 'Speichern…' : 'Werktage speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Mitarbeiter ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Mitarbeiter</CardTitle>
            </div>
            {!showAddForm && (
              <Button size="sm" variant="outline" onClick={openAddForm} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Hinzufügen
              </Button>
            )}
          </div>
          <CardDescription>
            Nutzer mit Zugriff auf diesen Standort und ihre Standort-Rolle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Hinzufügen-Formular */}
          {showAddForm && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Mitarbeiter hinzufügen</p>

              {/* Nutzer-Suche */}
              <div className="space-y-1.5">
                <Label className="text-xs">Nutzer suchen</Label>
                <Input
                  placeholder="Name oder E-Mail…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {/* Nutzer-Liste */}
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background divide-y divide-border">
                {orgUsersLoading ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">Laden…</div>
                ) : filteredOrgUsers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">Keine Treffer.</div>
                ) : (
                  filteredOrgUsers.slice(0, 50).map((u) => {
                    const isAssigned = assignedIds.has(u.id)
                    const isSelected = selectedUserId === u.id
                    return (
                      <button
                        key={u.id}
                        type="button"
                        disabled={isAssigned}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-primary/10'
                            : isAssigned
                            ? 'opacity-40 cursor-not-allowed bg-muted/30'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-muted">
                            {getInitials(u.name, u.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                          {u.name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                          {isAssigned && (
                            <span className="text-xs text-muted-foreground">Bereits zugewiesen</span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
                {filteredOrgUsers.length > 50 && (
                  <p className="p-2 text-xs text-muted-foreground text-center">
                    Mehr als 50 Treffer – verfeinere die Suche.
                  </p>
                )}
              </div>

              {/* Standort-Rolle */}
              <div className="space-y-1.5">
                <Label className="text-xs">Standort-Rolle</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as 'KITCHEN_STAFF' | 'LOCATION_ADMIN')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KITCHEN_STAFF">Küche</SelectItem>
                    <SelectItem value="LOCATION_ADMIN">Standort-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {addError && <p className="text-sm text-destructive">{addError}</p>}

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={addStaff} disabled={addSaving || !selectedUserId}>
                  {addSaving ? 'Speichern…' : 'Hinzufügen'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Mitarbeiter-Liste */}
          {staffLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : staffError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{staffError}</p>
            </div>
          ) : staff.length === 0 && !showAddForm ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Noch keine Mitarbeiter zugewiesen.</p>
              <Button size="sm" variant="outline" onClick={openAddForm} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Mitarbeiter hinzufügen
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {staff.map((s) => (
                <div key={s.userId} className="flex items-center gap-3 px-4 py-3 bg-background">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(s.user.name, s.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.user.name ?? s.user.email}
                    </p>
                    {s.user.name && (
                      <p className="text-xs text-muted-foreground truncate">{s.user.email}</p>
                    )}
                  </div>
                  {/* Rollen-Select */}
                  <Select
                    value={s.role}
                    onValueChange={(v) => changeRole(s.userId, v as 'KITCHEN_STAFF' | 'LOCATION_ADMIN')}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KITCHEN_STAFF">Küche</SelectItem>
                      <SelectItem value="LOCATION_ADMIN">Standort-Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Entfernen */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mitarbeiter entfernen</AlertDialogTitle>
                        <AlertDialogDescription>
                          Möchtest du <strong>{s.user.name ?? s.user.email}</strong> vom Standort{' '}
                          <strong>{location?.name}</strong> entfernen? Der Account bleibt erhalten.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeStaff(s.userId)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Entfernen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
