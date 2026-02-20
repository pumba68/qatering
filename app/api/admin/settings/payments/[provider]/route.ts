export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { encryptConfig, invalidateActiveProvidersCache } from '@/lib/payment-config'

const VALID_PROVIDERS = ['stripe', 'paypal', 'sumup'] as const
type ValidProvider = (typeof VALID_PROVIDERS)[number]

/** PUT /api/admin/settings/payments/[provider] — save/update provider config */
export async function PUT(
  request: NextRequest,
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

  const userId = (user as { id?: string }).id
  const body = await request.json()
  const { isEnabled, config } = body as { isEnabled: boolean; config: Record<string, unknown> }

  if (typeof isEnabled !== 'boolean' || !config || typeof config !== 'object') {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  // Encrypt the config JSON
  const configJson = encryptConfig(JSON.stringify(config))

  await prisma.paymentProviderConfig.upsert({
    where: { organizationId_provider: { organizationId, provider } },
    update: { isEnabled, configJson, updatedById: userId },
    create: { organizationId, provider, isEnabled, configJson, updatedById: userId },
  })

  invalidateActiveProvidersCache()

  return NextResponse.json({ success: true })
}
