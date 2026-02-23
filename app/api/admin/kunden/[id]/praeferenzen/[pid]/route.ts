export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/admin/kunden/[id]/praeferenzen/[pid]
 * Entfernt eine explizite Präferenz (Admin). Erzeugt Audit-Eintrag REMOVED.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { error, organizationId, user: adminUser } = await getAdminContext()
    if (error) return error
    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId, pid: prefId } = await params

    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const pref = await prisma.customerPreference.findFirst({
      where: { id: prefId, userId, source: { not: 'DERIVED' } },
    })
    if (!pref) {
      return NextResponse.json(
        { error: 'Präferenz nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.customerPreference.delete({ where: { id: prefId } })

    const adminId = (adminUser as { id?: string }).id ?? ''
    const adminName = (adminUser as { name?: string }).name ?? 'Admin'

    await prisma.preferenceAuditLog.create({
      data: {
        userId,
        action: 'REMOVED',
        key: pref.key,
        value: pref.value ?? null,
        changedById: adminId,
        changedByName: adminName,
      },
    })

    return NextResponse.json({ message: 'Präferenz erfolgreich entfernt' })
  } catch (err) {
    console.error('Fehler beim Entfernen der Präferenz:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
