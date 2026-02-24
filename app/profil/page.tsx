'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  User, Mail, Lock, Leaf, Bell, Wallet, Package,
  AlertTriangle, ChevronDown, ChevronUp, Check, X,
  LogOut, Loader2, Bot,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderSummary = {
  id: string
  pickupCode: string
  status: string
  channel: string
  totalAmount: number
  finalAmount: number | null
  discountAmount: number | null
  pickupDate: string
  pickupTimeSlot: string | null
  createdAt: string
  notes: string | null
  location: { id: string; name: string } | null
  items: { id: string; quantity: number; price: number; productName: string }[]
}

interface ProfileData {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    createdAt: string
    marketingEmailConsent: boolean
    isAnonymous: boolean
    hasPassword: boolean
  }
  wallet: { balance: number } | null
  lastOrder: { id: string; status: string; createdAt: string; totalAmount: number } | null
  preferences: {
    explicit: { id: string; key: string; type: string; source: string }[]
    derived: { id: string; key: string; confidence: number | null }[]
  }
  pushSubscribed: boolean
  pendingEmailChange: { newEmail: string; expiresAt: string; sentAt: string } | null
}

// ─── Preference metadata ─────────────────────────────────────────────────────

const PREF_META: Record<string, { emoji: string; label: string; group: 'allergen' | 'diet' }> = {
  ALLERGEN_GLUTEN:      { emoji: '🌾', label: 'Gluten',        group: 'allergen' },
  ALLERGEN_CRUSTACEANS: { emoji: '🦐', label: 'Krebstiere',    group: 'allergen' },
  ALLERGEN_EGGS:        { emoji: '🥚', label: 'Eier',          group: 'allergen' },
  ALLERGEN_FISH:        { emoji: '🐟', label: 'Fisch',         group: 'allergen' },
  ALLERGEN_PEANUTS:     { emoji: '🥜', label: 'Erdnüsse',      group: 'allergen' },
  ALLERGEN_SOYBEANS:    { emoji: '🌿', label: 'Soja',          group: 'allergen' },
  ALLERGEN_MILK:        { emoji: '🥛', label: 'Milch',         group: 'allergen' },
  ALLERGEN_TREE_NUTS:   { emoji: '🌰', label: 'Schalenfrüchte', group: 'allergen' },
  ALLERGEN_CELERY:      { emoji: '🥗', label: 'Sellerie',      group: 'allergen' },
  ALLERGEN_MUSTARD:     { emoji: '🌻', label: 'Senf',          group: 'allergen' },
  ALLERGEN_SESAME:      { emoji: '⚪', label: 'Sesam',         group: 'allergen' },
  ALLERGEN_SULPHITES:   { emoji: '🍷', label: 'Sulfite',       group: 'allergen' },
  ALLERGEN_LUPIN:       { emoji: '🌸', label: 'Lupinen',       group: 'allergen' },
  ALLERGEN_MOLLUSCS:    { emoji: '🦪', label: 'Weichtiere',    group: 'allergen' },
  DIET_VEGETARIAN:      { emoji: '🥦', label: 'Vegetarisch',   group: 'diet' },
  DIET_VEGAN:           { emoji: '🌱', label: 'Vegan',         group: 'diet' },
  DIET_HALAL:           { emoji: '☪️', label: 'Halal',         group: 'diet' },
  DIET_KOSHER:          { emoji: '✡️', label: 'Koscher',       group: 'diet' },
  DIET_GLUTEN_FREE:     { emoji: '🌾', label: 'Glutenfrei',    group: 'diet' },
  DIET_LACTOSE_FREE:    { emoji: '🥛', label: 'Laktosefrei',   group: 'diet' },
  DIET_LOW_CARB:        { emoji: '📉', label: 'Low Carb',      group: 'diet' },
  DIET_KETO:            { emoji: '🥩', label: 'Keto',          group: 'diet' },
}

const ALLERGEN_KEYS = Object.keys(PREF_META).filter((k) => PREF_META[k].group === 'allergen')
const DIET_KEYS     = Object.keys(PREF_META).filter((k) => PREF_META[k].group === 'diet')

// ─── Order status config ──────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Bestellt',             color: 'text-orange-600 bg-orange-100' },
  CONFIRMED: { label: 'Bestätigt',            color: 'text-blue-600 bg-blue-100' },
  PREPARING: { label: 'In Zubereitung',       color: 'text-amber-600 bg-amber-100' },
  READY:     { label: 'Bereit zur Abholung',  color: 'text-green-600 bg-green-100' },
  PICKED_UP: { label: 'Abgeholt',             color: 'text-muted-foreground bg-muted' },
  CANCELLED: { label: 'Storniert',            color: 'text-red-600 bg-red-100' },
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
      type === 'success'
        ? 'bg-green-50 border border-green-200 text-green-700'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {message}
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="h-px bg-border/50" />
      {children}
    </div>
  )
}

// ─── Hero Header ─────────────────────────────────────────────────────────────

function HeroHeader({ user }: { user: ProfileData['user'] }) {
  const initials = getInitials(user.name, user.email)
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30">
      <div className="container max-w-lg mx-auto px-4 py-8 flex items-center gap-4">
        <div className="relative shrink-0">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name || 'Profil'} className="w-16 h-16 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {user.name || user.email.split('@')[0]}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Mitglied seit {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Mini Dashboard ──────────────────────────────────────────────────────────

function MiniDashboard({ wallet, lastOrder }: {
  wallet: ProfileData['wallet']
  lastOrder: ProfileData['lastOrder']
}) {
  const statusConf = lastOrder ? (ORDER_STATUS_CONFIG[lastOrder.status] ?? { label: lastOrder.status, color: 'text-muted-foreground bg-muted' }) : null

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Wallet card */}
      <Link href="/wallet" className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 block">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-xs text-muted-foreground">Guthaben</span>
        </div>
        <p className="text-xl font-bold text-foreground">
          {wallet ? `${wallet.balance.toFixed(2).replace('.', ',')} €` : '—'}
        </p>
      </Link>

      {/* Last order card */}
      {lastOrder ? (
        <Link href={`/order/confirmation/${lastOrder.id}`} className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">Letzte Bestellung</span>
          </div>
          <p className="text-xs text-muted-foreground">{formatDateTime(lastOrder.createdAt)}</p>
          {statusConf && (
            <span className={`inline-flex items-center mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConf.color}`}>
              {statusConf.label}
            </span>
          )}
        </Link>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">Letzte Bestellung</span>
          </div>
          <p className="text-sm text-muted-foreground italic">Noch keine Bestellungen</p>
        </div>
      )}
    </div>
  )
}

// ─── Pending Email Banner ────────────────────────────────────────────────────

function PendingEmailBanner({
  pending, onCancel, cancelling,
}: {
  pending: NonNullable<ProfileData['pendingEmailChange']>
  onCancel: () => void
  cancelling: boolean
}) {
  const expiresDate = new Date(pending.expiresAt)
  const hoursLeft = Math.max(0, Math.round((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60)))

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            E-Mail-Änderung ausstehend
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5 break-all">
            Bitte bestätige: <strong>{pending.newEmail}</strong>
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
            Link gültig noch {hoursLeft} Std.
          </p>
        </div>
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 disabled:opacity-50"
        >
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Abbrechen'}
        </button>
      </div>
    </div>
  )
}

// ─── Stammdaten Section ──────────────────────────────────────────────────────

function StammdatenSection({
  user, onNameSaved, onEmailChangeRequested,
}: {
  user: ProfileData['user']
  onNameSaved: (name: string) => void
  onEmailChangeRequested: () => void
}) {
  const [nameEdit, setNameEdit] = useState(false)
  const [nameValue, setNameValue] = useState(user.name || '')
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [emailExpanded, setEmailExpanded] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  async function handleSaveName() {
    if (!nameValue.trim()) { setNameError('Name darf nicht leer sein'); return }
    setNameSaving(true)
    setNameError('')
    try {
      const r = await fetch('/api/profil/stammdaten', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      })
      if (!r.ok) {
        const d = await r.json()
        setNameError(d.error || 'Fehler beim Speichern')
        return
      }
      setNameEdit(false)
      onNameSaved(nameValue.trim())
    } finally {
      setNameSaving(false)
    }
  }

  async function handleRequestEmailChange() {
    if (!newEmail.trim()) { setEmailError('E-Mail erforderlich'); return }
    setEmailSending(true)
    setEmailError('')
    try {
      const r = await fetch('/api/profil/email-aendern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      })
      const d = await r.json()
      if (!r.ok) { setEmailError(d.error || 'Fehler'); return }
      setEmailExpanded(false)
      setNewEmail('')
      onEmailChangeRequested()
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <Section icon={User} title="Stammdaten">
      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
        {/* Name row */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium text-foreground">{user.name || <span className="italic text-muted-foreground">Nicht gesetzt</span>}</p>
            </div>
            {!user.isAnonymous && (
              <button
                onClick={() => { setNameEdit(!nameEdit); setNameValue(user.name || ''); setNameError('') }}
                className="text-sm text-primary hover:underline"
              >
                {nameEdit ? 'Abbrechen' : 'Ändern'}
              </button>
            )}
          </div>

          {nameEdit && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Dein Name"
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {nameError && <p className="text-xs text-red-600">{nameError}</p>}
              <button
                onClick={handleSaveName}
                disabled={nameSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl disabled:opacity-50"
              >
                {nameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Speichern
              </button>
            </div>
          )}
        </div>

        {/* Email row */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">E-Mail</p>
              <p className="text-sm font-medium text-foreground break-all">{user.email}</p>
            </div>
            {!user.isAnonymous && (
              <button
                onClick={() => { setEmailExpanded(!emailExpanded); setEmailError('') }}
                className="text-sm text-primary hover:underline shrink-0 ml-2"
              >
                {emailExpanded ? 'Abbrechen' : 'Ändern'}
              </button>
            )}
          </div>

          {emailExpanded && (
            <div className="mt-3 space-y-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="neue@email.de"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">
                Ein Bestätigungslink wird an die neue Adresse gesendet. Deine aktuelle E-Mail bleibt bis zur Bestätigung aktiv.
              </p>
              {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              <button
                onClick={handleRequestEmailChange}
                disabled={emailSending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl disabled:opacity-50"
              >
                {emailSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Bestätigungslink senden
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

// ─── Sicherheit Section ──────────────────────────────────────────────────────

function SicherheitSection({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [pwLinkSent, setPwLinkSent] = useState(false)
  const [pwSending, setPwSending] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [dangerOpen, setDangerOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handlePasswordReset() {
    setPwSending(true)
    try {
      const r = await fetch('/api/profil/passwort-reset', { method: 'POST' })
      const d = await r.json()
      if (d.hasPassword === false) {
        setPwMessage('Du hast dich mit einem externen Anbieter registriert. Eine Passwortänderung ist nicht erforderlich.')
      } else {
        setPwLinkSent(true)
        setPwMessage(d.message || `Wir haben dir einen Link an ${email} gesendet.`)
      }
    } finally {
      setPwSending(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteEmail !== email) { setDeleteError('Die eingegebene E-Mail stimmt nicht überein'); return }
    setDeleting(true)
    setDeleteError('')
    try {
      const r = await fetch('/api/profil/konto-loeschen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail }),
      })
      const d = await r.json()
      if (!r.ok) {
        if (d.error === 'active_order') {
          setDeleteError(d.message || 'Du hast noch eine laufende Bestellung.')
        } else {
          setDeleteError(d.error || 'Fehler beim Löschen')
        }
        return
      }
      await signOut({ callbackUrl: '/login?deleted=1' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Section icon={Lock} title="Sicherheit">
      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
        {/* Password row */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Passwort</p>
              <p className="text-sm font-medium text-foreground">
                {hasPassword ? '••••••••' : 'Kein Passwort (externer Anbieter)'}
              </p>
            </div>
            {hasPassword && !pwLinkSent && (
              <button
                onClick={handlePasswordReset}
                disabled={pwSending}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
              >
                {pwSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Link senden
              </button>
            )}
          </div>
          {pwMessage && (
            <p className="mt-2 text-sm text-muted-foreground">{pwMessage}</p>
          )}
        </div>

        {/* Danger zone */}
        <div className="p-4">
          <button
            onClick={() => setDangerOpen(!dangerOpen)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Konto löschen</span>
            </div>
            {dangerOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {dangerOpen && (
            <div className="mt-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Was wird gelöscht:</p>
                <ul className="space-y-1">
                  {['Dein Name und E-Mail-Adresse', 'Dein Profilbild', 'Alle Präferenzen & Allergene', 'Push-Benachrichtigungsabos'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <X className="w-3.5 h-3.5 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-foreground mt-2">Was erhalten bleibt:</p>
                <ul className="space-y-1">
                  {['Bestellhistorie (anonymisiert)', 'Wallet-Transaktionen (anonymisiert)'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 shrink-0 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Konto unwiderruflich löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setDeleteModalOpen(false) }}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4" role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-desc">
            <h3 id="delete-title" className="text-lg font-bold text-foreground">Bist du sicher?</h3>
            <p id="delete-desc" className="text-sm text-muted-foreground">
              Diese Aktion kann nicht rückgängig gemacht werden. Gib zur Bestätigung deine E-Mail-Adresse ein.
            </p>
            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder={email}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-xl hover:bg-muted/80"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteEmail !== email}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

// ─── Präferenzen Section ─────────────────────────────────────────────────────

function PraeferenzenSection({
  data, onDataChange, onToast,
}: {
  data: ProfileData
  onDataChange: (patch: Partial<ProfileData>) => void
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const activeKeys = new Set(data.preferences.explicit.map((p) => p.key))

  async function togglePref(key: string) {
    const wasActive = activeKeys.has(key)
    // Optimistic update
    const newExplicit = wasActive
      ? data.preferences.explicit.filter((p) => p.key !== key)
      : [...data.preferences.explicit, { id: '_tmp', key, type: 'EXPLICIT', source: 'USER' }]
    onDataChange({ preferences: { ...data.preferences, explicit: newExplicit } })

    const r = await fetch('/api/profil/praeferenzen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, active: !wasActive }),
    })
    if (!r.ok) {
      // Revert
      onDataChange({ preferences: { ...data.preferences } })
      onToast('Speichern fehlgeschlagen. Bitte erneut versuchen.', 'error')
    }
  }

  async function handleDerivedAction(id: string, key: string, action: 'confirm' | 'ignore') {
    const r = await fetch(`/api/profil/praeferenzen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!r.ok) { onToast('Fehler bei der Aktion', 'error'); return }

    const newDerived = data.preferences.derived.filter((d) => d.id !== id)
    let newExplicit = data.preferences.explicit
    if (action === 'confirm') {
      newExplicit = [...data.preferences.explicit, { id, key, type: 'EXPLICIT', source: 'USER' }]
    }
    onDataChange({ preferences: { explicit: newExplicit, derived: newDerived } })
  }

  function PreferenceChip({ prefKey }: { prefKey: string }) {
    const meta = PREF_META[prefKey]
    const isAllergen = meta?.group === 'allergen'
    const isActive = activeKeys.has(prefKey)

    return (
      <button
        onClick={() => togglePref(prefKey)}
        role="checkbox"
        aria-checked={isActive}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
          isActive
            ? isAllergen
              ? 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium'
              : 'border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium'
            : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/60'
        }`}
      >
        <span aria-hidden="true">{meta?.emoji}</span>
        <span>{meta?.label || prefKey}</span>
        {isActive && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
      </button>
    )
  }

  const noExplicit = data.preferences.explicit.length === 0

  return (
    <Section icon={Leaf} title="Präferenzen & Allergene">
      <div className="space-y-4">
        {noExplicit && (
          <p className="text-sm text-muted-foreground px-1">
            Noch keine Präferenzen hinterlegt. Wähle deine Allergene und Ernährungsweise aus.
          </p>
        )}

        {/* Allergens */}
        <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Allergene</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_KEYS.map((k) => <PreferenceChip key={k} prefKey={k} />)}
          </div>
        </div>

        {/* Diet categories */}
        <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Ernährungsweise</p>
          <div className="flex flex-wrap gap-2">
            {DIET_KEYS.map((k) => <PreferenceChip key={k} prefKey={k} />)}
          </div>
        </div>

        {/* AI suggestions */}
        {data.preferences.derived.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Von der KI erkannt — bitte bestätigen
              </span>
            </div>
            <p className="text-xs text-amber-600/80">Basierend auf deinen bisherigen Bestellungen</p>

            <div className="space-y-2">
              {data.preferences.derived.map((d) => {
                const meta = PREF_META[d.key]
                const confidence = d.confidence ? Math.round(d.confidence * 100) : null
                return (
                  <div key={d.id} className="flex items-center justify-between bg-white/60 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{meta?.emoji || '?'}</span>
                      <span className="text-sm font-medium">{meta?.label || d.key}</span>
                      {confidence !== null && (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                          {confidence}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDerivedAction(d.id, d.key, 'confirm')}
                        aria-label={`${meta?.label || d.key} bestätigen`}
                        className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => handleDerivedAction(d.id, d.key, 'ignore')}
                        aria-label={`${meta?.label || d.key} ignorieren`}
                        className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        Nein
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── Benachrichtigungen Section ──────────────────────────────────────────────

function BenachrichtigungenSection({
  data, onDataChange, onToast,
}: {
  data: ProfileData
  onDataChange: (patch: Partial<ProfileData>) => void
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [pushLoading, setPushLoading] = useState(false)
  const [pushDenied, setPushDenied] = useState(false)

  async function handleToggleMarketing() {
    const newValue = !data.user.marketingEmailConsent
    onDataChange({ user: { ...data.user, marketingEmailConsent: newValue } })
    const r = await fetch('/api/profil/einstellungen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketingEmailConsent: newValue }),
    })
    if (!r.ok) {
      onDataChange({ user: { ...data.user, marketingEmailConsent: !newValue } })
      onToast('Fehler beim Speichern', 'error')
    }
  }

  async function handleActivatePush() {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      onToast('Push-Benachrichtigungen werden in diesem Browser nicht unterstützt', 'error')
      return
    }
    if (Notification.permission === 'denied') {
      setPushDenied(true)
      return
    }
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setPushDenied(true); return }

      const reg = await navigator.serviceWorker.register('/sw.js')
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { onToast('VAPID-Key nicht konfiguriert', 'error'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      const r = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh!)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth!)))),
          },
        }),
      })
      if (r.ok) {
        onDataChange({ pushSubscribed: true })
        onToast('Push-Benachrichtigungen aktiviert', 'success')
      } else {
        onToast('Fehler beim Aktivieren', 'error')
      }
    } catch {
      onToast('Fehler beim Aktivieren der Push-Benachrichtigungen', 'error')
    } finally {
      setPushLoading(false)
    }
  }

  async function handleDeactivatePush() {
    setPushLoading(true)
    try {
      const r = await fetch('/api/profil/push-subscription', { method: 'DELETE' })
      if (r.ok) {
        onDataChange({ pushSubscribed: false })
        onToast('Push-Benachrichtigungen deaktiviert', 'success')
      } else {
        onToast('Fehler beim Deaktivieren', 'error')
      }
    } finally {
      setPushLoading(false)
    }
  }

  function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  return (
    <Section icon={Bell} title="Benachrichtigungen">
      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
        {/* Marketing email */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Marketing-E-Mails</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aktionen, Angebote & Neuigkeiten per E-Mail
              </p>
            </div>
            <ToggleSwitch checked={data.user.marketingEmailConsent} onChange={handleToggleMarketing} />
          </div>
          {!data.user.marketingEmailConsent && (
            <p className="mt-2 ml-11 text-xs text-muted-foreground">Du kannst dich jederzeit wieder anmelden.</p>
          )}
        </div>

        {/* Push notifications */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Push-Benachrichtigungen</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bestellstatus, Aktionen deiner Kantine
              </p>
            </div>
            {data.pushSubscribed ? (
              <button
                onClick={handleDeactivatePush}
                disabled={pushLoading}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 disabled:opacity-50"
              >
                {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deaktivieren'}
              </button>
            ) : (
              <button
                onClick={handleActivatePush}
                disabled={pushLoading}
                className="text-xs text-white bg-primary hover:bg-primary/90 rounded-lg px-2.5 py-1.5 font-medium disabled:opacity-50"
              >
                {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aktivieren'}
              </button>
            )}
          </div>

          {!data.pushSubscribed && !pushDenied && (
            <p className="mt-2 ml-11 text-xs text-muted-foreground">
              Aktiviere Push um Bestellstatus-Updates sofort zu erhalten.
            </p>
          )}

          {pushDenied && (
            <div className="mt-2 ml-11 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              Push-Benachrichtigungen sind in deinem Browser blockiert. Bitte entsperre sie in den Browser-Einstellungen unter Datenschutz &gt; Benachrichtigungen.
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

// ─── Bestellungen Tab ────────────────────────────────────────────────────────

function BestellungenTab() {
  const [orders, setOrders] = useState<{ upcoming: OrderSummary[]; history: OrderSummary[] } | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetch('/api/profil/bestellungen?page=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setOrders({ upcoming: d.upcoming, history: d.history })
          setTotalPages(d.pagination.totalPages)
        }
      })
      .finally(() => setLoadingOrders(false))
  }, [])

  async function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const r = await fetch(`/api/profil/bestellungen?page=${nextPage}`)
      if (!r.ok) return
      const d = await r.json()
      setOrders((prev) =>
        prev ? { ...prev, history: [...prev.history, ...d.history] } : prev
      )
      setPage(nextPage)
      setTotalPages(d.pagination.totalPages)
    } finally {
      setLoadingMore(false)
    }
  }

  function formatPickupDate(dateStr: string, timeSlot: string | null) {
    const d = new Date(dateStr)
    const dayStr = d.toLocaleDateString('de-DE', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    })
    return timeSlot ? `${dayStr} · ${timeSlot} Uhr` : dayStr
  }

  function OrderCard({ order, variant }: { order: OrderSummary; variant: 'active' | 'history' }) {
    const statusConf = ORDER_STATUS_CONFIG[order.status] ?? {
      label: order.status, color: 'text-muted-foreground bg-muted',
    }
    const displayAmount = order.finalAmount ?? order.totalAmount

    return (
      <div className={`rounded-xl border p-4 space-y-3 ${
        variant === 'active'
          ? 'bg-white dark:bg-card border-amber-200 dark:border-amber-800'
          : 'bg-card border-border/50'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatPickupDate(order.pickupDate, order.pickupTimeSlot)}
            </p>
            {order.location && (
              <p className="text-xs text-muted-foreground mt-0.5">{order.location.name}</p>
            )}
          </div>
          <span className={`inline-flex items-center shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusConf.color}`}>
            {statusConf.label}
          </span>
        </div>

        {/* Pickup code */}
        <p className="text-xs text-muted-foreground font-mono">Code: {order.pickupCode}</p>

        <div className="h-px bg-border/50" />

        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-baseline justify-between text-sm gap-2">
              <span className="text-foreground min-w-0">
                <span className="font-medium text-muted-foreground mr-1">{item.quantity}×</span>
                <span className="truncate">{item.productName}</span>
              </span>
              <span className="text-muted-foreground shrink-0">
                {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
              </span>
            </div>
          ))}
        </div>

        <div className="h-px bg-border/50" />

        {/* Total row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {order.discountAmount ? (
              <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                -{order.discountAmount.toFixed(2).replace('.', ',')} € Rabatt
              </span>
            ) : null}
          </div>
          <p className="text-sm font-bold text-foreground">
            {displayAmount.toFixed(2).replace('.', ',')} €
          </p>
        </div>
      </div>
    )
  }

  if (loadingOrders) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!orders) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Bestellungen konnten nicht geladen werden.</p>
      </div>
    )
  }

  const hasAny = orders.upcoming.length > 0 || orders.history.length > 0

  if (!hasAny) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">Noch keine Bestellungen</p>
          <p className="text-sm text-muted-foreground">Bestelle dein erstes Gericht über das Menü.</p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl"
        >
          Zum Menü
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Active orders */}
      {orders.upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Aktive Bestellungen</h2>
          </div>
          <div className="space-y-3">
            {orders.upcoming.map((order) => (
              <OrderCard key={order.id} order={order} variant="active" />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {orders.history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Bestellhistorie</h2>
          </div>
          <div className="space-y-3">
            {orders.history.map((order) => (
              <OrderCard key={order.id} order={order} variant="history" />
            ))}
          </div>
          {page < totalPages && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Mehr laden
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [cancellingEmail, setCancellingEmail] = useState(false)
  const [activeTab, setActiveTab] = useState<'profil' | 'bestellungen'>('profil')

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateData = useCallback((patch: Partial<ProfileData>) => {
    setData((d) => d ? { ...d, ...patch } : d)
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profil')
      return
    }
    const role = (session?.user as any)?.role
    if (['ADMIN', 'SUPER_ADMIN', 'KITCHEN_STAFF'].includes(role)) {
      router.push('/admin')
      return
    }
    fetch('/api/profil')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .finally(() => setLoading(false))
  }, [status, session, router])

  async function handleCancelEmailChange() {
    setCancellingEmail(true)
    try {
      await fetch('/api/profil/email-aendern', { method: 'DELETE' })
      setData((d) => d ? { ...d, pendingEmailChange: null } : d)
      showToast('E-Mail-Änderung abgebrochen', 'success')
    } finally {
      setCancellingEmail(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Profil konnte nicht geladen werden.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <HeroHeader user={data.user} />

      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 flex gap-1">
          {(['profil', 'bestellungen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'profil' ? 'Profil' : 'Bestellungen'}
            </button>
          ))}
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 pt-5">
        {activeTab === 'profil' && (
          <div className="space-y-6">
            <MiniDashboard wallet={data.wallet} lastOrder={data.lastOrder} />

            {data.pendingEmailChange && (
              <PendingEmailBanner
                pending={data.pendingEmailChange}
                onCancel={handleCancelEmailChange}
                cancelling={cancellingEmail}
              />
            )}

            <StammdatenSection
              user={data.user}
              onNameSaved={(name) => {
                updateData({ user: { ...data.user, name } })
                showToast('Name gespeichert', 'success')
              }}
              onEmailChangeRequested={() => {
                fetch('/api/profil').then((r) => r.json()).then((d) => d && setData(d))
                showToast('Bestätigungslink gesendet. Prüfe dein Postfach.', 'success')
              }}
            />

            <SicherheitSection email={data.user.email} hasPassword={data.user.hasPassword} />

            <PraeferenzenSection data={data} onDataChange={updateData} onToast={showToast} />

            <BenachrichtigungenSection data={data} onDataChange={updateData} onToast={showToast} />

            {/* Sign out footer */}
            <div className="pt-4 pb-8 flex justify-center">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </button>
            </div>
          </div>
        )}

        {activeTab === 'bestellungen' && <BestellungenTab />}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </main>
  )
}
