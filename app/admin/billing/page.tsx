'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, FileDown, CheckCircle, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

interface CompanyOverview {
  id: string
  name: string
  contractNumber: string | null
  openBalance: number
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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  INVOICED: 'Rechnung gestellt',
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
                  </tr>
                </thead>
                <tbody>
                  {overview.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-muted-foreground">{c.contractNumber ?? '–'}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(c.openBalance)}</td>
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
          <CardDescription>Vertragspartner und Abrechnungsmonat wählen, dann Rechnung anlegen (Entwurf). Anschließend PDF exportieren → Status „Rechnung gestellt“.</CardDescription>
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
          <CardDescription>Rechnungen des gewählten Vertragspartners. PDF exportieren setzt Status auf „Rechnung gestellt“.</CardDescription>
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
    </div>
  )
}
