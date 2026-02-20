export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { getProviderConfig } from '@/lib/payment-config'

const VALID_PROVIDERS = ['stripe', 'paypal', 'sumup'] as const
type ValidProvider = (typeof VALID_PROVIDERS)[number]

/** POST /api/admin/settings/payments/[provider]/test — test provider connection */
export async function POST(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const provider = params.provider as ValidProvider
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Ungültiger Provider' }, { status: 400 })
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Keine Organisation' }, { status: 400 })
  }

  const record = await getProviderConfig(organizationId, provider)
  if (!record) {
    return NextResponse.json({ success: false, message: 'Kein API-Key konfiguriert.' })
  }

  try {
    if (provider === 'stripe') {
      const cfg = record.config as { secretKey?: string }
      if (!cfg.secretKey) {
        return NextResponse.json({ success: false, message: 'Stripe Secret Key fehlt.' })
      }
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${cfg.secretKey}` },
      })
      if (!res.ok) {
        const body = await res.json() as { error?: { message?: string } }
        return NextResponse.json({ success: false, message: body.error?.message ?? 'Stripe API Fehler' })
      }
      return NextResponse.json({ success: true, message: 'Verbunden mit Stripe.' })
    }

    if (provider === 'paypal') {
      const cfg = record.config as { clientId?: string; clientSecret?: string; environment?: string }
      if (!cfg.clientId || !cfg.clientSecret) {
        return NextResponse.json({ success: false, message: 'PayPal Client ID oder Secret fehlt.' })
      }
      const baseUrl = cfg.environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'
      const credentials = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')
      const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })
      if (!res.ok) {
        return NextResponse.json({ success: false, message: 'PayPal Authentifizierung fehlgeschlagen.' })
      }
      return NextResponse.json({ success: true, message: 'Verbunden mit PayPal.' })
    }

    if (provider === 'sumup') {
      const cfg = record.config as { apiKey?: string }
      if (!cfg.apiKey) {
        return NextResponse.json({ success: false, message: 'SumUp API-Key fehlt.' })
      }
      const res = await fetch('https://api.sumup.com/v0.1/me', {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
      })
      if (!res.ok) {
        return NextResponse.json({ success: false, message: 'SumUp API-Key ungültig.' })
      }
      return NextResponse.json({ success: true, message: 'Verbunden mit SumUp.' })
    }

    return NextResponse.json({ success: false, message: 'Unbekannter Provider.' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verbindungsfehler'
    return NextResponse.json({ success: false, message: msg })
  }
}
