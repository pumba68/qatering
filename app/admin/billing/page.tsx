'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, FileDown, CheckCircle, Plus, Landmark, AlertCircle, X, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Returns the earliest allowed SEPA Core due date (5 business days from now). */
function earliestDueDateStr(): string {
  const d = new Date()
  let added = 0
  while (added < 5) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d.toISOString().slice(0, 10)
}

interface CompanyOverview {
  id: string
  name: string
  contractNumber: string | null
  openBalance: number
  sepaComplete: boolean
  _count: { orders: number }
}

interface InvoiceItem {
  id: string
  orderNumber: string
  orderDate: string
  employeeName: string
  amount: string | number
}

interface Invoice {
  id: string
  companyId: string
  year: number
  month: number
  status: string
  totalAmount: string | number
  invoicedAt: string | null
  createdAt: string
  company: { id: string; name: string; contractNumber: string | null }
  items: InvoiceItem[]
}

interface SepaModalState {
  companyId: string
  companyName: string
  sepaComplete: boolean
}

interface SepaPreview {
  type: 'invoiced' | 'open_balance'
  invoices?: { id: string; year: number; month: number; totalAmount: number }[]
  openBalance?: number
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  INVOICED: 'Rechnung gestellt',
  SEPA_SUBMITTED: 'SEPA eingereicht',
  PAID: 'Bezahlt',
}

export default function AdminBillingPage() {
  const [overview, setOverview] = useState<CompanyOverview[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [createYear, setCreateYear] = useState(() => new Date().getFullYear())
  const [createMonth, setCreateMonth] = useState(() => new Date().getMonth() + 1)
  const [creating, setCreating] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)

  // SEPA modal state
  const [sepaModal, setSepaModal] = useState<SepaModalState | null>(null)
  const [sepaSource, setSepaSource] = useState<'INVOICED' | 'OPEN_BALANCE'>('INVOICED')
  const [sepaSeqType, setSepaSeqType] = useState<'FRST' | 'RCUR'>('RCUR')
  const [sepaDueDate, setSepaDueDate] = useState<string>(earliestDueDateStr())
  const [sepaPreview, setSepaPreview] = useState<SepaPreview | null>(null)
  const [sepaPreviewLoading, setSepaPreviewLoading] = useState(false)
  const [sepaGenerating, setSepaGenerating] = useState(false)
  const [sepaError, setSepaError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true)
    try {
      const res = await fetch('/api/admin/billing/overview')
      if (!res.ok) throw new Error('Fehler')
      const data = await res.json()
      setOverview(data)
    } catch {
      setOverview([])
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    if (!selectedCompanyId) {
      setInvoices([])
      return
    }
    setLoadingInvoices(true)
    try {
      const res = await fetch(`/api/admin/billing/invoices?companyId=${selectedCompanyId}`)
      if (!res.ok) throw new Error('Fehler')
      const data = await res.json()
      setInvoices(data)
    } catch {
      setInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }, [selectedCompanyId])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Load SEPA preview when modal opens or source changes
  useEffect(() => {
    if (!sepaModal) return
    const { companyId } = sepaModal

    const load = async () => {
      setSepaPreviewLoading(true)
      setSepaPreview(null)
      setSepaError(null)
      try {
        if (sepaSource === 'INVOICED') {
          const res = await fetch(`/api/admin/billing/invoices?companyId=${companyId}`)
          if (!res.ok) throw new Error('Fehler beim Laden der Rechnungen')
          const data: Invoice[] = await res.json()
          const invoiced = data.filter((i) => i.status === 'INVOICED')
          setSepaPreview({
            type: 'invoiced',
            invoices: invoiced.map((i) => ({
              id: i.id,
              year: i.year,
              month: i.month,
              totalAmount: Number(i.totalAmount),
            })),
          })
        } else {
          const res = await fetch('/api/admin/billing/overview')
          if (!res.ok) throw new Error('Fehler beim Laden des Saldos')
          const data: CompanyOverview[] = await res.json()
          const company = data.find((c) => c.id === companyId)
          setSepaPreview({
            type: 'open_balance',
            openBalance: company?.openBalance ?? 0,
          })
        }
      } catch (e) {
        setSepaError(e instanceof Error ? e.message : 'Vorschau konnte nicht geladen werden.')
      } finally {
        setSepaPreviewLoading(false)
      }
    }

    load()
  }, [sepaModal, sepaSource])

  const openSepaModal = (company: CompanyOverview) => {
    setSepaDueDate(earliestDueDateStr())
    setSepaSource('INVOICED')
    setSepaSeqType('RCUR')
    setSepaPreview(null)
    setSepaError(null)
    setSepaModal({
      companyId: company.id,
      companyName: company.name,
      sepaComplete: company.sepaComplete,
    })
  }

  const closeSepaModal = () => {
    setSepaModal(null)
    setSepaPreview(null)
    setSepaError(null)
  }

  const handleSepaGenerate = async () => {
    if (!sepaModal) return
    setSepaGenerating(true)
    setSepaError(null)
    try {
      const res = await fetch('/api/admin/billing/sepa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: sepaModal.companyId,
          source: sepaSource,
          dueDate: sepaDueDate,
          seqType: sepaSeqType,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Generieren')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?([^";]+)"?/)
      const filename = match?.[1] ?? 'sepa-lastschrift.xml'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      closeSepaModal()
      await fetchOverview()
      await fetchInvoices()
    } catch (e) {
      setSepaError(e instanceof Error ? e.message : 'Generierung fehlgeschlagen.')
    } finally {
      setSepaGenerating(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedCompanyId) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          year: createYear,
          month: createMonth,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setDetailInvoice(data)
      await fetchInvoices()
      await fetchOverview()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Rechnung konnte nicht erstellt werden.')
    } finally {
      setCreating(false)
    }
  }

  const handleExportPdf = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/admin/billing/invoices/${invoiceId}/export-pdf`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Export fehlgeschlagen')
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?([^";]+)"?/)
      const filename = match?.[1] ?? 'Rechnung.pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      await fetchInvoices()
      if (detailInvoice?.id === invoiceId) {
        setDetailInvoice((prev) => (prev ? { ...prev, status: 'INVOICED' } : null))
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'PDF-Export fehlgeschlagen.')
    }
  }

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/admin/billing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (!res.ok) throw new Error('Status konnte nicht gesetzt werden.')
      await fetchInvoices()
      if (detailInvoice?.id === invoiceId) {
        setDetailInvoice((prev) => (prev ? { ...prev, status: 'PAID' } : null))
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler.')
    }
  }

  const sepaTotal =
    sepaPreview?.type === 'invoiced'
      ? sepaPreview.invoices?.reduce((s, i) => s + i.totalAmount, 0) ?? 0
      : sepaPreview?.openBalance ?? 0

  const sepaHasPositions =
    sepaPreview?.type === 'invoiced'
      ? (sepaPreview.invoices?.length ?? 0) > 0
      : (sepaPreview?.openBalance ?? 0) > 0

  const minDueDate = earliestDueDateStr()

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Vertragspartner-Abrechnung
        </h1>
        <p className="text-muted-foreground mt-1">
          Zuschusskosten pro Unternehmen einsehen, Monatsrechnungen erstellen, PDF exportieren und als bezahlt markieren.
        </p>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Offene Salden (noch nicht abgerechnet)</CardTitle>
          <CardDescription>Summe der Zuschussbeträge aus Bestellungen, die noch keiner Rechnung zugeordnet sind.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOverview ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Unternehmen</th>
                    <th className="text-left py-2 font-medium">Vertragsnummer</th>
                    <th className="text-right py-2 font-medium">Offener Betrag</th>
                    <th className="text-center py-2 font-medium">SEPA</th>
                    <th className="text-right py-2 font-medium">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-muted-foreground">{c.contractNumber ?? '–'}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(c.openBalance)}</td>
                      <td className="py-2 text-center">
                        {c.sepaComplete ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Vollständig
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Fehlt
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => openSepaModal(c)}
                        >
                          <Landmark className="h-3.5 w-3.5" />
                          SEPA-Lastschrift
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {overview.length === 0 && (
                <p className="text-muted-foreground py-6 text-center">Keine Vertragspartner mit offenem Saldo.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Rechnung erstellen</CardTitle>
          <CardDescription>Vertragspartner und Abrechnungsmonat wählen, dann Rechnung anlegen (Entwurf). Anschließend PDF exportieren → Status „Rechnung gestellt".</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Unternehmen</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">— wählen —</option>
              {overview.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Monat</label>
            <select
              value={createMonth}
              onChange={(e) => setCreateMonth(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Jahr</label>
            <select
              value={createYear}
              onChange={(e) => setCreateYear(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {[createYear - 1, createYear, createYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleCreateInvoice}
            disabled={!selectedCompanyId || creating}
            className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Wird erstellt…' : 'Rechnung erstellen'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Rechnungen</CardTitle>
          <CardDescription>Rechnungen des gewählten Vertragspartners. PDF exportieren setzt Status auf „Rechnung gestellt".</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4">
            <label className="text-sm font-medium">Unternehmen (Filter)</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">— wählen —</option>
              {overview.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {loadingInvoices ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 p-4"
                >
                  <div>
                    <span className="font-medium">{MONTHS[inv.month - 1]} {inv.year}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{formatCurrency(inv.totalAmount)}</span>
                    <Badge className="ml-2" variant={inv.status === 'PAID' ? 'default' : 'secondary'}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {inv.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleExportPdf(inv.id)}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF exportieren
                      </Button>
                    )}
                    {inv.status === 'INVOICED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleMarkPaid(inv.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Als bezahlt markieren
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (detailInvoice?.id === inv.id) {
                          setDetailInvoice(null)
                          return
                        }
                        try {
                          const res = await fetch(`/api/admin/billing/invoices/${inv.id}`)
                          if (res.ok) setDetailInvoice(await res.json())
                        } catch {
                          setDetailInvoice(inv)
                        }
                      }}
                    >
                      {detailInvoice?.id === inv.id ? 'Details schließen' : 'Details'}
                    </Button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && selectedCompanyId && (
                <p className="text-muted-foreground py-6 text-center">Keine Rechnungen für dieses Unternehmen.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {detailInvoice && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle>Rechnung {MONTHS[detailInvoice.month - 1]} {detailInvoice.year} – {detailInvoice.company.name}</CardTitle>
            <CardDescription>Einzelposten: Bestellnummer, Datum, Mitarbeiter, Summe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Bestellnummer</th>
                    <th className="text-left py-2 font-medium">Datum</th>
                    <th className="text-left py-2 font-medium">Mitarbeiter</th>
                    <th className="text-right py-2 font-medium">Summe (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInvoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2">{item.orderNumber}</td>
                      <td className="py-2">{new Date(item.orderDate).toLocaleDateString('de-DE')}</td>
                      <td className="py-2">{item.employeeName}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-medium text-foreground">
              Gesamtbetrag: {formatCurrency(Number(detailInvoice.totalAmount))}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── SEPA Modal ───────────────────────────────────────────────────────────── */}
      {sepaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="font-semibold text-lg">SEPA-Lastschrift generieren</h2>
                  <p className="text-sm text-muted-foreground">{sepaModal.companyName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={closeSepaModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">

              {/* SEPA data warning */}
              {!sepaModal.sepaComplete && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    Für diesen Vertragspartner sind keine vollständigen SEPA-Bankdaten hinterlegt (IBAN, BIC, Mandatsreferenz, Mandatsdatum). Bitte zuerst unter <strong>Vertragspartner</strong> ergänzen.
                  </p>
                </div>
              )}

              {/* Source selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quelle</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSepaSource('INVOICED')}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      sepaSource === 'INVOICED'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-medium block">INVOICED-Rechnungen</span>
                    <span className="text-xs text-muted-foreground">Rechnungen mit Status &quot;Rechnung gestellt&quot;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSepaSource('OPEN_BALANCE')}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      sepaSource === 'OPEN_BALANCE'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-medium block">Offener Saldo</span>
                    <span className="text-xs text-muted-foreground">Noch nicht abgerechnete Bestellungen</span>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Positionen</label>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 min-h-[80px]">
                  {sepaPreviewLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : sepaPreview?.type === 'invoiced' ? (
                    sepaPreview.invoices?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Keine Rechnungen mit Status &quot;Rechnung gestellt&quot;.</p>
                    ) : (
                      <div className="space-y-1">
                        {sepaPreview.invoices?.map((inv) => (
                          <div key={inv.id} className="flex justify-between text-sm">
                            <span>{MONTHS[inv.month - 1]} {inv.year}</span>
                            <span className="font-medium">{formatCurrency(inv.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : sepaPreview?.type === 'open_balance' ? (
                    <div className="flex justify-between text-sm">
                      <span>Offener Saldo</span>
                      <span className="font-medium">{formatCurrency(sepaPreview.openBalance ?? 0)}</span>
                    </div>
                  ) : null}
                </div>
                {!sepaPreviewLoading && sepaPreview && (
                  <div className="flex justify-between text-sm font-semibold px-1">
                    <span>Gesamtbetrag</span>
                    <span>{formatCurrency(sepaTotal)}</span>
                  </div>
                )}
              </div>

              {/* Sequence type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sequenztyp</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['RCUR', 'FRST'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSepaSeqType(type)}
                      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                        sepaSeqType === type
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                          : 'border-border hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-medium block">{type}</span>
                      <span className="text-xs text-muted-foreground">
                        {type === 'RCUR' ? 'Wiederkehrende Lastschrift' : 'Erstlastschrift'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fälligkeitsdatum</label>
                <input
                  type="date"
                  value={sepaDueDate}
                  min={minDueDate}
                  onChange={(e) => setSepaDueDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  SEPA CORE erfordert mindestens 5 Werktage Vorlaufzeit. Frühestes Datum: {minDueDate}.
                </p>
              </div>

              {/* Error */}
              {sepaError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{sepaError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
              <Button variant="outline" onClick={closeSepaModal} disabled={sepaGenerating}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSepaGenerate}
                disabled={
                  !sepaModal.sepaComplete ||
                  sepaGenerating ||
                  !sepaHasPositions ||
                  sepaTotal <= 0 ||
                  !sepaDueDate ||
                  sepaDueDate < minDueDate
                }
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                <Download className="h-4 w-4" />
                {sepaGenerating ? 'Wird generiert…' : 'Generieren & Herunterladen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
