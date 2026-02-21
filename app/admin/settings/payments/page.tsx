'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Zap,
  Landmark,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Simple Toggle ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? 'bg-green-500' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── MaskedKeyField ────────────────────────────────────────────────────────────
function MaskedKeyField({
  label,
  maskedValue,
  fieldKey,
  editValues,
  setEditValues,
  editing,
  onEdit,
}: {
  label: string
  maskedValue: string
  fieldKey: string
  editValues: Record<string, string>
  setEditValues: (v: Record<string, string>) => void
  editing: boolean
  onEdit: () => void
}) {
  const [show, setShow] = useState(false)
  const value = editValues[fieldKey] ?? ''

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="relative flex-1">
            <Input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setEditValues({ ...editValues, [fieldKey]: e.target.value })}
              placeholder={`Neuen ${label} eingeben`}
              className="pr-10 font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground">
            {maskedValue || '(nicht konfiguriert)'}
          </code>
        )}
        {!editing && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProviderData {
  provider: string
  isEnabled: boolean
  config: Record<string, unknown>
  updatedAt?: string
}

interface Transaction {
  id: string
  createdAt: string
  amount: number
  type: string
  paymentProvider: string | null
  externalPaymentId: string | null
  description: string | null
  user: { id: string; name: string | null; email: string }
}

// ── ProviderCard ──────────────────────────────────────────────────────────────
function ProviderCard({
  title,
  icon,
  data,
  fields,
  extraContent,
  onSave,
}: {
  title: string
  icon: React.ReactNode
  data: ProviderData | undefined
  fields: { key: string; label: string }[]
  extraContent?: (
    editValues: Record<string, string>,
    setEditValues: (v: Record<string, string>) => void,
    editing: boolean
  ) => React.ReactNode
  onSave: (isEnabled: boolean, config: Record<string, unknown>) => Promise<void>
}) {
  const [isEnabled, setIsEnabled] = useState(data?.isEnabled ?? false)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (data) setIsEnabled(data.isEnabled)
  }, [data])

  const handleEdit = (key: string) => {
    setEditing(true)
    if (!editValues[key]) setEditValues((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const config: Record<string, unknown> = { ...(data?.config ?? {}) }
      for (const [k, v] of Object.entries(editValues)) {
        if (v.trim()) config[k] = v.trim()
      }
      await onSave(isEnabled, config)
      setEditing(false)
      setEditValues({})
      toast.success('Gespeichert')
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const provider = title.toLowerCase()
      const res = await fetch(`/api/admin/settings/payments/${provider}/test`, { method: 'POST' })
      const body = await res.json() as { success: boolean; message: string }
      setTestResult(body)
    } catch {
      setTestResult({ success: false, message: 'Verbindungsfehler' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isEnabled ? 'Aktiviert' : 'Deaktiviert'}
            </span>
            <Toggle
              checked={isEnabled}
              onChange={(v) => {
                setIsEnabled(v)
                // Auto-save enabled state immediately
                const config: Record<string, unknown> = { ...(data?.config ?? {}) }
                onSave(v, config).catch(() => setIsEnabled(!v))
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((f) => (
          <MaskedKeyField
            key={f.key}
            label={f.label}
            maskedValue={String(data?.config?.[f.key] ?? '')}
            fieldKey={f.key}
            editValues={editValues}
            setEditValues={setEditValues}
            editing={editing}
            onEdit={() => handleEdit(f.key)}
          />
        ))}

        {extraContent && extraContent(editValues, setEditValues, editing)}

        {editing && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Speichern
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditing(false); setEditValues({}) }}
            >
              Abbrechen
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Zap className="h-3.5 w-3.5 mr-1" />
            )}
            Verbindung testen
          </Button>
          {testResult && (
            <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── SepaField (reusable inline-edit row) ─────────────────────────────────────
function SepaField({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string
  value: string
  placeholder: string
  onSave: (val: string | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            placeholder={placeholder}
            className="font-mono text-sm h-8"
            autoFocus
          />
          <Button size="sm" className="h-8" disabled={saving} onClick={async () => {
            setSaving(true)
            try { await onSave(draft || null); setEditing(false) }
            finally { setSaving(false) }
          }}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(false)}>
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono text-foreground">
                {value}
              </code>
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            </>
          ) : (
            <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground">
              (nicht konfiguriert)
            </code>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setEditing(true); setDraft(value) }} className="shrink-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ── SepaCreditorCard ──────────────────────────────────────────────────────────
function SepaCreditorCard() {
  const [settings, setSettings] = useState({ sepaCreditorId: '', sepaIban: '', sepaBic: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings/sepa')
      .then((r) => r.json())
      .then((d) => {
        setSettings({
          sepaCreditorId: d.sepaCreditorId ?? '',
          sepaIban: d.sepaIban ?? '',
          sepaBic: d.sepaBic ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveField = async (field: string, val: string | null) => {
    const res = await fetch('/api/admin/settings/sepa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Fehler')
    setSettings((prev) => ({ ...prev, [field]: data[field] ?? '' }))
    toast.success('Gespeichert')
  }

  const isComplete = !!(settings.sepaCreditorId && settings.sepaIban && settings.sepaBic)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">SEPA Direct Debit – Betreiber-Einstellungen</CardTitle>
          </div>
          {!loading && (
            isComplete ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Vollständig
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <XCircle className="h-3.5 w-3.5" /> Unvollständig
              </span>
            )
          )}
        </div>
        <CardDescription>
          Diese Daten werden in alle SEPA Direct Debit Dateien (pain.008) eingetragen. Alle drei Felder
          sind Pflicht um SEPA-Lastschriften generieren zu können.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            <SepaField
              label="Gläubiger-ID (Creditor Identifier)"
              value={settings.sepaCreditorId}
              placeholder="DE98ZZZ09999999999"
              onSave={(v) => saveField('sepaCreditorId', v)}
            />
            <SepaField
              label="Betreiber-IBAN (Empfängerkonto für Lastschriften)"
              value={settings.sepaIban}
              placeholder="DE89370400440532013000"
              onSave={(v) => saveField('sepaIban', v)}
            />
            <SepaField
              label="Betreiber-BIC"
              value={settings.sepaBic}
              placeholder="DEUTDEDB"
              onSave={(v) => saveField('sepaBic', v)}
            />
            {!isComplete && (
              <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                Bitte alle drei Felder ausfüllen um SEPA Direct Debit Dateien generieren zu können.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentSettingsPage() {
  const [providers, setProviders] = useState<ProviderData[]>([])
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txProvider, setTxProvider] = useState('')
  const [txLoading, setTxLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/payments')
      const data = await res.json() as { providers: ProviderData[] }
      setProviders(data.providers ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTransactions = useCallback(async (page: number, provider: string) => {
    setTxLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (provider) params.set('provider', provider)
      const res = await fetch(`/api/admin/settings/payments/transactions?${params}`)
      const data = await res.json() as {
        transactions: Transaction[]
        total: number
        totalPages: number
      }
      setTransactions(data.transactions ?? [])
      setTxTotal(data.total ?? 0)
      setTxTotalPages(data.totalPages ?? 1)
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => { loadProviders() }, [loadProviders])
  useEffect(() => { loadTransactions(txPage, txProvider) }, [loadTransactions, txPage, txProvider])

  const getProvider = (name: string) => providers.find((p) => p.provider === name)

  const saveProvider = async (provider: string, isEnabled: boolean, config: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/settings/payments/${provider}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled, config }),
    })
    if (!res.ok) throw new Error('Fehler beim Speichern')
    await loadProviders()
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ export: 'csv' })
      if (txProvider) params.set('provider', txProvider)
      const res = await fetch(`/api/admin/settings/payments/transactions?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transaktionen-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Zahlungseinstellungen</h1>
          <p className="text-muted-foreground">
            Konfigurieren Sie Ihre Payment-Provider und verwalten Sie API-Keys.
          </p>
        </div>

        {/* SEPA Gläubiger-ID */}
        <SepaCreditorCard />

        {/* Stripe */}
        <ProviderCard
          title="stripe"
          icon={<CreditCard className="h-5 w-5 text-indigo-500" />}
          data={getProvider('stripe')}
          fields={[
            { key: 'publishableKey', label: 'Publishable Key (pk_…)' },
            { key: 'secretKey', label: 'Secret Key (sk_…)' },
            { key: 'webhookSecret', label: 'Webhook Secret (whsec_…)' },
          ]}
          extraContent={(editValues, setEditValues, editing) => {
            const cfg = getProvider('stripe')?.config ?? {}
            const boolVal = (k: string) => {
              if (editing && editValues[k] !== undefined) return editValues[k] === 'true'
              return cfg[k] !== false
            }
            const toggleMethod = (k: string) => {
              setEditValues({ ...editValues, [k]: String(!boolVal(k)) })
            }
            return (
              <div className="pt-2 space-y-2">
                <Label className="text-xs text-muted-foreground">Aktivierte Methoden</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'enableCreditCard', label: 'Kreditkarte' },
                    { key: 'enableApplePay', label: 'Apple Pay' },
                    { key: 'enableGooglePay', label: 'Google Pay' },
                    { key: 'enableSepa', label: 'SEPA-Lastschrift' },
                  ].map((m) => (
                    <label key={m.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={boolVal(m.key)}
                        onChange={() => toggleMethod(m.key)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          }}
          onSave={(isEnabled, config) => saveProvider('stripe', isEnabled, config)}
        />

        {/* PayPal */}
        <ProviderCard
          title="paypal"
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">P</span>
          }
          data={getProvider('paypal')}
          fields={[
            { key: 'clientId', label: 'Client ID' },
            { key: 'clientSecret', label: 'Client Secret' },
            { key: 'webhookId', label: 'Webhook ID' },
          ]}
          extraContent={(editValues, setEditValues, editing) => {
            const cfg = getProvider('paypal')?.config ?? {}
            const env = editing && editValues['environment']
              ? editValues['environment']
              : String(cfg['environment'] ?? 'sandbox')
            return (
              <div className="flex items-center gap-4 pt-1">
                <Label className="text-xs text-muted-foreground">Umgebung</Label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paypal-env"
                    value="sandbox"
                    checked={env === 'sandbox'}
                    onChange={() => setEditValues({ ...editValues, environment: 'sandbox' })}
                  />
                  <span className="text-sm">Sandbox</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paypal-env"
                    value="live"
                    checked={env === 'live'}
                    onChange={() => setEditValues({ ...editValues, environment: 'live' })}
                  />
                  <span className="text-sm">Live</span>
                </label>
              </div>
            )
          }}
          onSave={(isEnabled, config) => saveProvider('paypal', isEnabled, config)}
        />

        {/* SumUp */}
        <ProviderCard
          title="sumup"
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">S</span>
          }
          data={getProvider('sumup')}
          fields={[
            { key: 'apiKey', label: 'API-Key (Access Token)' },
            { key: 'merchantCode', label: 'Merchant Code' },
            { key: 'terminalId', label: 'Terminal-ID' },
          ]}
          onSave={(isEnabled, config) => saveProvider('sumup', isEnabled, config)}
        />

        {/* Transaction Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Transaktionsübersicht</CardTitle>
                <CardDescription>
                  {txTotal} Wallet-Aufladungen via Payment-Provider
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={txProvider}
                  onChange={(e) => { setTxProvider(e.target.value); setTxPage(1) }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Alle Provider</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="sumup">SumUp</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTransactions(txPage, txProvider)}
                  disabled={txLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${txLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={exporting}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Keine Transaktionen gefunden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Datum</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nutzer</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Betrag</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Methode</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Externe ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{tx.user.name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-600">
                          +{tx.amount.toFixed(2)} €
                        </td>
                        <td className="px-4 py-2.5">
                          {tx.paymentProvider ? (
                            <Badge variant="secondary" className="capitalize">
                              {tx.paymentProvider}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <code className="text-xs text-muted-foreground truncate max-w-[160px] block">
                            {tx.externalPaymentId ?? '—'}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Seite {txPage} von {txTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage <= 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                    disabled={txPage >= txTotalPages}
                  >
                    Weiter
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
