'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { History, ArrowLeft } from 'lucide-react'

type TxType = 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND' | 'ADJUSTMENT'

interface Tx {
  id: string
  type: TxType
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  orderId: string | null
  createdAt: string
}

interface Res {
  transactions: Tx[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const TYPE_LABEL: Record<TxType, string> = {
  TOP_UP: 'Aufladung',
  ORDER_PAYMENT: 'Bestellung',
  REFUND: 'Erstattung',
  ADJUSTMENT: 'Anpassung',
}

export default function WalletHistoryPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<Res | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (typeFilter) params.set('type', typeFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    setLoading(true)
    fetch(`/api/wallet/transactions?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d)
      })
      .finally(() => setLoading(false))
  }, [status, page, typeFilter, dateFrom, dateTo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Lade…</div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Bitte anmelden.</p>
          <Link href="/login" className="text-primary hover:underline">Zum Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/wallet"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <History className="w-6 h-6" />
          Transaktionshistorie
        </h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Alle Typen</option>
            <option value="TOP_UP">Aufladung</option>
            <option value="ORDER_PAYMENT">Bestellung</option>
            <option value="REFUND">Erstattung</option>
            <option value="ADJUSTMENT">Anpassung</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Von"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Bis"
          />
        </div>

        {loading ? (
          <div className="text-muted-foreground py-8">Lade Transaktionen…</div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="text-muted-foreground py-8">Keine Transaktionen.</div>
        ) : (
          <>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-left p-3 font-medium">Typ</th>
                    <th className="text-right p-3 font-medium">Betrag</th>
                    <th className="text-right p-3 font-medium">Guthaben danach</th>
                    <th className="text-left p-3 font-medium">Beschreibung</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 text-muted-foreground">
                        {formatDate(t.createdAt)} {formatTime(t.createdAt)}
                      </td>
                      <td className="p-3">{TYPE_LABEL[t.type]}</td>
                      <td className={`p-3 text-right font-medium ${t.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(t.balanceAfter)}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={t.description || ''}>
                        {t.description || '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-input bg-background disabled:opacity-50 hover:bg-accent"
                >
                  Zurück
                </button>
                <span className="text-sm text-muted-foreground">
                  Seite {data.page} von {data.totalPages} ({data.total} Einträge)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="px-4 py-2 rounded-lg border border-input bg-background disabled:opacity-50 hover:bg-accent"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/wallet" className="text-primary hover:underline font-medium">
            ← Zurück zum Guthaben
          </Link>
        </div>
      </div>
    </div>
  )
}
