export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { getMaskedProviderConfigs } from '@/lib/payment-config'

/** GET /api/admin/settings/payments — returns all provider configs (keys masked) */
export async function GET() {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  if (!organizationId) {
    return NextResponse.json({ providers: [] })
  }

  const providers = await getMaskedProviderConfigs(organizationId)
  return NextResponse.json({ providers })
}
