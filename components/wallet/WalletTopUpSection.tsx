'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const TOP_UP_AMOUNTS = [10, 20, 25, 50]

// ── PaymentForm (inner, requires Stripe Elements context) ─────────────────────
function PaymentForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number
  onSuccess: (newBalance?: number) => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setErrorMsg(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Zahlung fehlgeschlagen.')
      setSubmitting(false)
      return
    }

    // Payment confirmed client-side — verify server-side and credit wallet immediately
    try {
      const res = await fetch('/api/payments/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent?.id }),
      })
      const data = await res.json() as { success?: boolean; balance?: number; error?: string }
      if (!res.ok || data.error) {
        // Verify failed — webhook will handle it as fallback
        toast.info('Zahlung eingegangen, Guthaben wird in Kürze aktualisiert.')
        onSuccess()
      } else {
        onSuccess(data.balance)
      }
    } catch {
      toast.info('Zahlung eingegangen, Guthaben wird in Kürze aktualisiert.')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || !stripe} className="flex-1">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {submitting ? 'Wird verarbeitet…' : `Jetzt ${amount} € aufladen`}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}

// ── WalletTopUpSection ────────────────────────────────────────────────────────
export function WalletTopUpSection({ onBalanceChange }: { onBalanceChange?: (balance: number) => void }) {
  const [activeProviders, setActiveProviders] = useState<string[]>([])
  const [providersLoaded, setProvidersLoaded] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<StripeClient | null> | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check active providers
  useEffect(() => {
    fetch('/api/payments/providers/active')
      .then((r) => r.json())
      .then((d: { providers: string[] }) => {
        setActiveProviders(d.providers ?? [])
        setProvidersLoaded(true)
      })
      .catch(() => setProvidersLoaded(true))
  }, [])

  const createPaymentIntent = useCallback(async (amount: number) => {
    setLoadingIntent(true)
    setClientSecret(null)
    try {
      const res = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json() as { clientSecret?: string; publishableKey?: string; error?: string }
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Fehler beim Erstellen der Zahlung')
        return
      }
      if (data.publishableKey) {
        setStripePromise(loadStripe(data.publishableKey))
      }
      setClientSecret(data.clientSecret ?? null)
    } catch {
      toast.error('Verbindungsfehler – bitte prüfen Sie Ihre Internetverbindung')
    } finally {
      setLoadingIntent(false)
    }
  }, [])

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setClientSecret(null)
    setSuccess(false)
    createPaymentIntent(amount)
  }

  const handleSuccess = (newBalance?: number) => {
    setSuccess(true)
    setClientSecret(null)
    setSelectedAmount(null)
    if (newBalance !== undefined && onBalanceChange) {
      onBalanceChange(newBalance)
    }
    toast.success(
      newBalance !== undefined
        ? `Guthaben aufgeladen! Neues Guthaben: ${newBalance.toFixed(2).replace('.', ',')} €`
        : 'Guthaben erfolgreich aufgeladen!'
    )
  }

  // Don't render if providers not yet loaded or stripe not active
  if (!providersLoaded) return null
  if (!activeProviders.includes('stripe')) return null

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-1">Guthaben aufladen</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Sicher bezahlen mit Kreditkarte, Apple Pay, Google Pay oder SEPA
      </p>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm mb-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Aufladung erfolgreich!
        </div>
      )}

      {/* Amount Selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {TOP_UP_AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleAmountSelect(amt)}
            disabled={loadingIntent}
            className={`py-3 rounded-lg border text-sm font-semibold transition-all ${
              selectedAmount === amt
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-primary hover:bg-accent'
            }`}
          >
            {amt} €
          </button>
        ))}
      </div>

      {/* Loading indicator while creating intent */}
      {loadingIntent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Zahlungsformular wird geladen…
        </div>
      )}

      {/* Stripe Payment Element */}
      {clientSecret && stripePromise && selectedAmount && !loadingIntent && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#6366f1',
                borderRadius: '8px',
              },
            },
          }}
        >
          <PaymentForm
            amount={selectedAmount}
            onSuccess={handleSuccess}
            onCancel={() => {
              setClientSecret(null)
              setSelectedAmount(null)
            }}
          />
        </Elements>
      )}
    </div>
  )
}
