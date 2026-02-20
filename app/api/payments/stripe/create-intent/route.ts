export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getStripeForOrg, getStripePublishableKey } from '@/lib/stripe'
import { MIN_TOP_UP } from '@/lib/wallet'

const VALID_AMOUNTS = [10, 20, 25, 50]

/**
 * POST /api/payments/stripe/create-intent
 * Creates a Stripe Payment Intent for wallet top-up.
 * Returns clientSecret + publishableKey for the frontend.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Session ungültig' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, email: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  const body = await request.json() as { amount?: number }
  const amount = Number(body.amount)

  if (!amount || amount < MIN_TOP_UP) {
    return NextResponse.json({ error: `Mindestbetrag: ${MIN_TOP_UP} €` }, { status: 400 })
  }
  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.json({ error: 'Ungültiger Betrag' }, { status: 400 })
  }

  const organizationId = user.organizationId ?? 'default'

  try {
    const stripe = await getStripeForOrg(organizationId)
    const publishableKey = await getStripePublishableKey(organizationId)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        organizationId,
        topUpAmount: String(amount),
        type: 'WALLET_TOP_UP',
      },
      description: `Wallet-Aufladung ${amount} € für ${user.email}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey,
      paymentIntentId: paymentIntent.id,
      amount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe-Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
