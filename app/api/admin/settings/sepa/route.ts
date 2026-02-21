export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { validateCreditorId, validateIban, validateBic } from '@/lib/sepa/validation'

/**
 * GET /api/admin/settings/sepa
 * Returns the organization's SEPA settings (Gläubiger-ID, Betreiber-IBAN, Betreiber-BIC).
 */
export async function GET() {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  if (!organizationId) {
    return NextResponse.json({ sepaCreditorId: null, sepaIban: null, sepaBic: null })
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { sepaCreditorId: true, sepaIban: true, sepaBic: true },
  })

  return NextResponse.json({
    sepaCreditorId: org?.sepaCreditorId ?? null,
    sepaIban: org?.sepaIban ?? null,
    sepaBic: org?.sepaBic ?? null,
  })
}

/**
 * PUT /api/admin/settings/sepa
 * Updates the organization's SEPA settings.
 * Body: { sepaCreditorId?, sepaIban?, sepaBic? }
 */
export async function PUT(request: NextRequest) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 400 })
  }

  const body = await request.json()
  const updateData: Record<string, string | null> = {}

  // Validate and process sepaCreditorId
  if ('sepaCreditorId' in body) {
    const raw = body.sepaCreditorId
    if (raw !== null && raw !== '' && raw !== undefined) {
      const err = validateCreditorId(String(raw))
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      updateData.sepaCreditorId = String(raw).replace(/\s/g, '').toUpperCase()
    } else {
      updateData.sepaCreditorId = null
    }
  }

  // Validate and process sepaIban
  if ('sepaIban' in body) {
    const raw = body.sepaIban
    if (raw !== null && raw !== '' && raw !== undefined) {
      const err = validateIban(String(raw))
      if (err) return NextResponse.json({ error: `Ungültige IBAN: ${err}` }, { status: 400 })
      updateData.sepaIban = String(raw).replace(/\s/g, '').toUpperCase()
    } else {
      updateData.sepaIban = null
    }
  }

  // Validate and process sepaBic
  if ('sepaBic' in body) {
    const raw = body.sepaBic
    if (raw !== null && raw !== '' && raw !== undefined) {
      const err = validateBic(String(raw))
      if (err) return NextResponse.json({ error: `Ungültiger BIC: ${err}` }, { status: 400 })
      updateData.sepaBic = String(raw).replace(/\s/g, '').toUpperCase()
    } else {
      updateData.sepaBic = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren.' }, { status: 400 })
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: updateData,
  })

  // Return all current SEPA settings
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { sepaCreditorId: true, sepaIban: true, sepaBic: true },
  })

  return NextResponse.json({
    sepaCreditorId: org?.sepaCreditorId ?? null,
    sepaIban: org?.sepaIban ?? null,
    sepaBic: org?.sepaBic ?? null,
  })
}
