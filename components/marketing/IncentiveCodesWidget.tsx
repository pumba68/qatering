'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Gift, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

type IncentiveCode = {
  id: string
  code: string | null
  name: string | null
  type?: string
  discountValue?: string | number
}

export function IncentiveCodesWidget() {
  const { status } = useSession()
  const [codes, setCodes] = useState<IncentiveCode[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch('/api/incentives/my-codes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => (Array.isArray(d) ? setCodes(d) : setCodes([])))
      .catch(() => setCodes([]))
      .finally(() => setLoading(false))
  }, [status])

  if (status !== 'authenticated' || loading || codes.length === 0) return null

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-4 mb-4">
      <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
        <Gift className="h-4 w-4 text-primary" />
        Ihre Gutscheincodes
      </h3>
      <div className="space-y-2">
        {codes.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{c.name || 'Gutschein'}</span>
              {c.discountValue != null && (
                <span className="text-muted-foreground ml-2">
                  ({typeof c.discountValue === 'number' ? `${c.discountValue}%` : c.discountValue})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-background px-2 py-1 rounded text-xs font-mono">{c.code}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => c.code && copyCode(c.code)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
