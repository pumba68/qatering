export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getStripeForOrg } from '@/lib/stripe'
import { topUp } from '@/lib/wallet'

/**
 * POST /api/payments/stripe/verify
 * Called by the frontend after confirmPayment() succeeds.
 * Retrieves the PaymentIntent from Stripe, verifies status = succeeded,
 * and credits the wallet (idempotent via externalPaymentId).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Session ungültig' }, { status: 401 })

  const body = await request.json() as { paymentIntentId?: string }
  const { paymentIntentId } = body
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId fehlt' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  const organizationId = user.organizationId ?? 'default'

  // Retrieve the PaymentIntent from Stripe
  let stripe
  try {
    stripe = await getStripeForOrg(organizationId)
  } catch {
    return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 })
  }

  let pi
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return NextResponse.json({ error: 'PaymentIntent nicht gefunden' }, { status: 404 })
  }

  // Security: verify this PI belongs to the current user
  if (pi.metadata?.userId !== userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: `Zahlung noch nicht abgeschlossen (${pi.status})` }, { status: 400 })
  }

  // Idempotency: already processed?
  const existing = await prisma.walletTransaction.findFirst({
    where: { externalPaymentId: pi.id },
  })
  if (existing) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    return NextResponse.json({ alreadyProcessed: true, balance: Number(wallet?.balance ?? 0) })
  }

  const topUpAmount = parseFloat(pi.metadata?.topUpAmount ?? '')
  if (isNaN(topUpAmount) || topUpAmount <= 0) {
    return NextResponse.json({ error: 'Ungültiger Betrag in Stripe-Metadaten' }, { status: 400 })
  }

  try {
    const updated = await topUp(userId, topUpAmount, {
      note: `Stripe-Aufladung ${topUpAmount} € (${pi.id})`,
      paymentProvider: 'stripe',
      externalPaymentId: pi.id,
    })
    return NextResponse.json({ success: true, balance: Number(updated.balance) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Buchungsfehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
