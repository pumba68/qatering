/**
 * PROJ-11: Stripe Server-Side Client
 * Loads Stripe secret key from PaymentProviderConfig (DB) or env fallback.
 */

import Stripe from 'stripe'
import { getProviderConfig, type StripeConfig } from '@/lib/payment-config'

let _stripeInstance: Stripe | null = null

/** Get a Stripe instance using the env fallback (for webhook handler where org context isn't available). */
export function getStripeFromEnv(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY env variable not set')
  return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' })
}

/** Get a Stripe instance for an organization (loads key from DB, falls back to env). */
export async function getStripeForOrg(organizationId: string): Promise<Stripe> {
  const record = await getProviderConfig<StripeConfig>(organizationId, 'stripe')
  const secretKey = record?.config?.secretKey || process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('Stripe ist nicht konfiguriert.')
  return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' })
}

/** Get Stripe publishable key for an organization. */
export async function getStripePublishableKey(organizationId: string): Promise<string | null> {
  const record = await getProviderConfig<StripeConfig>(organizationId, 'stripe')
  return record?.config?.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null
}

export { _stripeInstance }
