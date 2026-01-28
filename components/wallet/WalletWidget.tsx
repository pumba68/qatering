'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { Wallet, AlertCircle } from 'lucide-react'

interface WalletData {
  balance: number
  isLow: boolean
  isZero: boolean
  updatedAt: string
}

export function WalletWidget() {
  const { data: session, status } = useSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchWallet = useCallback(() => {
    if (status !== 'authenticated' || !session?.user) return
    setLoading(true)
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
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, session?.user])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      setWallet(null)
      return
    }
    fetchWallet()
  }, [status, session?.user, fetchWallet])

  useEffect(() => {
    const handler = () => fetchWallet()
    window.addEventListener('wallet-refresh', handler)
    return () => window.removeEventListener('wallet-refresh', handler)
  }, [fetchWallet])

  if (status !== 'authenticated' || !session?.user) return null

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/wallet"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent"
        title="Guthaben"
      >
        <Wallet className="w-4 h-4" />
        <span>
          {loading ? '…' : wallet != null ? `Guthaben: ${formatCurrency(wallet.balance)}` : 'Guthaben'}
        </span>
      </Link>
      {wallet && (wallet.isZero || wallet.isLow) && (
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          title={wallet.isZero ? 'Kein Guthaben – bitte aufladen' : 'Guthaben niedrig – bitte aufladen'}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {wallet.isZero ? 'Kein Guthaben' : 'Niedrig'}
        </Link>
      )}
    </div>
  )
}
