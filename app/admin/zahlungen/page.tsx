'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Download, RefreshCw, Receipt, ArrowUpCircle, ShoppingCart, RotateCcw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type TxType = 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND' | 'ADJUSTMENT'

interface Tx {
  id: string
  createdAt: string
  type: TxType
  amount: number
  balanceBefore: number
  balanceAfter: number
  paymentProvider: string | null
  externalPaymentId: string | null
  description: string | null
  user: { id: string; name: string | null; email: string }
  order: { id: string } | null
}

interface Stats {
  topUpSum: number
  topUpCount: number
  orderSum: number
  orderCount: number
  refundSum: number
  refundCount: number
}

interface Res {
  transactions: Tx[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: Stats
}

const TYPE_LABEL: Record<TxType, string> = {
  TOP_UP: 'Aufladung',
  ORDER_PAYMENT: 'Bestellung',
  REFUND: 'Erstattung',
  ADJUSTMENT: 'Anpassung',
}

const TYPE_ICON: Record<TxType, React.ReactNode> = {
  TOP_UP: <ArrowUpCircle className="w-3.5 h-3.5" />,
  ORDER_PAYMENT: <ShoppingCart className="w-3.5 h-3.5" />,
  REFUND: <RotateCcw className="w-3.5 h-3.5" />,
  ADJUSTMENT: <Wrench className="w-3.5 h-3.5" />,
}

const TYPE_COLOR: Record<TxType, string> = {
  TOP_UP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ORDER_PAYMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  REFUND: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ADJUSTMENT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

function methodLabel(tx: Tx): string {
  if (tx.paymentProvider) {
    return tx.paymentProvider.charAt(0).toUpperCase() + tx.paymentProvider.slice(1)
  }
  if (tx.type === 'TOP_UP') return 'Admin-Aufladung'
  if (tx.type === 'ORDER_PAYMENT') return 'Guthaben'
  return '–'
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ZahlungenPage() {
  const [data, setData] = useState<Res | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [provider, setProvider] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const buildParams = useCallback(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    if (type) p.set('type', type)
    if (provider) p.set('provider', provider)
    if (search) p.set('search', search)
    if (dateFrom) p.set('dateFrom', dateFrom)
    if (dateTo) p.set('dateTo', dateTo)
    return p
  }, [page, type, provider, search, dateFrom, dateTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/zahlungen?${buildParams()}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Fehler beim Laden der Transaktionen')
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData() }, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [search])

  // Immediate fetch on other filter changes
  useEffect(() => { fetchData() }, [page, type, provider, dateFrom, dateTo])

  const resetFilters = () => {
    setType(''); setProvider(''); setSearch(''); setDateFrom(''); setDateTo(''); setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const p = buildParams()
      p.set('export', 'csv')
      const res = await fetch(`/api/admin/zahlungen?${p}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zahlungen-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  const stats = data?.stats
  const txs = data?.transactions ?? []
  const hasActiveFilters = type || provider || search || dateFrom || dateTo

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Zahlungen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Alle Transaktionen: Aufladungen, Bestellungen, Erstattungen und Anpassungen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                Aufladungen
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.topUpSum)}</p>
              <p className="text-xs text-muted-foreground">{stats.topUpCount} Transaktionen</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                Bestellungen
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.orderSum)}</p>
              <p className="text-xs text-muted-foreground">{stats.orderCount} Transaktionen</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                Erstattungen
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.refundSum)}</p>
              <p className="text-xs text-muted-foreground">{stats.refundCount} Transaktionen</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground block mb-1">Suche (Name, E-Mail)</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Max Mustermann…"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Typ</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle Typen</option>
                <option value="TOP_UP">Aufladung</option>
                <option value="ORDER_PAYMENT">Bestellung</option>
                <option value="REFUND">Erstattung</option>
                <option value="ADJUSTMENT">Anpassung</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Zahlmethode</label>
              <select
                value={provider}
                onChange={(e) => { setProvider(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle Methoden</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="sumup">SumUp</option>
                <option value="admin">Admin-Aufladung</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Von</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Bis</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : txs.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Keine Transaktionen gefunden.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Datum</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kunde</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typ</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Betrag</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Methode</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Beschreibung</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Externe ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <div className="text-xs">
                            {new Date(tx.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground/70">
                            {new Date(tx.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{tx.user.name ?? '–'}</div>
                          <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[tx.type]}`}>
                            {TYPE_ICON[tx.type]}
                            {TYPE_LABEL[tx.type]}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.paymentProvider ? (
                            <Badge variant="secondary" className="capitalize text-xs">
                              {tx.paymentProvider}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{methodLabel(tx)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate hidden lg:table-cell" title={tx.description ?? ''}>
                          {tx.description || '–'}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {tx.externalPaymentId ? (
                            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {tx.externalPaymentId.slice(0, 20)}…
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {data.total} Einträge · Seite {data.page} von {data.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      Zurück
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}>
                      Weiter
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
