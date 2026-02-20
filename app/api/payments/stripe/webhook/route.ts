// NOTE: No 'force-dynamic' needed — webhook doesn't use getServerSession
// Raw body is required for Stripe signature verification

import { NextRequest, NextResponse } from 'next/server'
import { getStripeFromEnv } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { topUp } from '@/lib/wallet'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripeFromEnv()
    event = stripe.webhooks.constructEvent(body, signature ?? '', webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    await handlePaymentSucceeded(paymentIntent)
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.warn('[stripe webhook] Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId, topUpAmount } = paymentIntent.metadata ?? {}
  if (!userId || !topUpAmount) {
    console.error('[stripe webhook] Missing metadata on payment intent:', paymentIntent.id)
    return
  }

  const amount = parseFloat(topUpAmount)
  if (isNaN(amount) || amount <= 0) {
    console.error('[stripe webhook] Invalid topUpAmount:', topUpAmount)
    return
  }

  // Idempotency: check if this payment intent was already processed
  const existing = await prisma.walletTransaction.findFirst({
    where: { externalPaymentId: paymentIntent.id },
  })
  if (existing) {
    console.log('[stripe webhook] Already processed:', paymentIntent.id)
    return
  }

  try {
    await topUp(userId, amount, {
      note: `Stripe-Aufladung ${amount} € (${paymentIntent.id})`,
      paymentProvider: 'stripe',
      externalPaymentId: paymentIntent.id,
    })
    console.log(`[stripe webhook] Wallet aufgeladen: userId=${userId} amount=${amount} pi=${paymentIntent.id}`)
  } catch (err) {
    console.error('[stripe webhook] topUp failed:', err)
    throw err // Let Stripe retry
  }
}
