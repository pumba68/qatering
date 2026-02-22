export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/admin/kunden/[id]/identifiers/[iid]
 * Deaktiviert (Soft-Delete) einen Identifikator eines Kunden.
 * Setzt isActive=false und removedAt=now — kein hartes Löschen (Historisierung).
 * Nur Admins der gleichen Organisation.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; iid: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error

    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId, iid: identifierId } = await params

    // Sicherstellen: Kunde gehört zur selben Org
    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    // Identifikator gehört diesem Kunden und ist noch aktiv?
    const identifier = await prisma.customerIdentifier.findFirst({
      where: {
        id: identifierId,
        userId,
        isActive: true,
      },
    })

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifikator nicht gefunden oder bereits deaktiviert' },
        { status: 404 }
      )
    }

    // Soft-Delete: isActive=false + removedAt stempeln (Historisierung)
    const updated = await prisma.customerIdentifier.update({
      where: { id: identifierId },
      data: {
        isActive: false,
        removedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        value: true,
        isActive: true,
        removedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Identifikator erfolgreich deaktiviert',
      identifier: updated,
    })
  } catch (error) {
    console.error('Fehler beim Deaktivieren des Identifikators:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
