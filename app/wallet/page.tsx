'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { Wallet, History, AlertCircle, ArrowRight } from 'lucide-react'

interface WalletData {
  balance: number
  isLow: boolean
  isZero: boolean
  updatedAt: string
}

export default function WalletPage() {
  const { data: session, status } = useSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }
    fetch('/api/wallet')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setWallet({
          balance: d.balance ?? 0,
          isLow: !!d.isLow,
          isZero: !!d.isZero,
          updatedAt: d.updatedAt ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Lade Guthaben…</div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Bitte anmelden, um Ihr Guthaben zu sehen.</p>
          <Link href="/login" className="text-primary hover:underline">
            Zum Login
          </Link>
        </div>
      </div>
    )
  }

  const statusLabel = wallet?.isZero ? 'Kein Guthaben' : wallet?.isLow ? 'Niedrig' : 'Normal'
  const statusColor = wallet?.isZero ? 'text-red-600 dark:text-red-400' : wallet?.isLow ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Guthaben</h1>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Wallet className="w-5 h-5" />
            <span>Aktuelles Guthaben</span>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">
            {wallet ? formatCurrency(wallet.balance) : '–'}
          </p>
          <p className={`text-sm font-medium ${statusColor}`}>{statusLabel}</p>
          {(wallet?.isZero || wallet?.isLow) && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {wallet?.isZero
                  ? 'Kein Guthaben – Bitte Guthaben aufladen.'
                  : 'Guthaben niedrig – Bitte aufladen.'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Aufladung erfolgt über Ihre Kantine / Ihren Arbeitgeber.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/wallet/history"
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Transaktionshistorie</p>
                <p className="text-sm text-muted-foreground">Aufladungen, Bestellungen, Erstattungen</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/menu" className="text-primary hover:underline font-medium">
            ← Zurück zum Menü
          </Link>
        </div>
      </div>
    </div>
  )
}
