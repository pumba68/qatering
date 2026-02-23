export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  key: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1).optional(),
})

/**
 * POST /api/admin/kunden/[id]/praeferenzen/vorschlag/bestaetigen
 *
 * Bestätigt einen automatisch abgeleiteten Diät-Vorschlag.
 * Legt eine explizite Präferenz mit source=ADMIN an (oder überschreibt DERIVED).
 * Erzeugt Audit-Eintrag CONFIRMED.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId, user: adminUser } = await getAdminContext()
    if (error) return error
    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const validated = schema.parse(body)

    const adminId = (adminUser as { id?: string }).id ?? ''
    const adminName = (adminUser as { name?: string }).name ?? 'Admin'

    // Upsert: if DERIVED record exists update it, otherwise create ADMIN record
    const pref = await prisma.customerPreference.upsert({
      where: { userId_key: { userId, key: validated.key } },
      create: {
        userId,
        type: 'EXPLICIT',
        key: validated.key,
        source: 'ADMIN',
        ignored: false,
        confidence: validated.confidence ?? null,
        updatedById: adminId,
      },
      update: {
        type: 'EXPLICIT',
        source: 'ADMIN',
        ignored: false,
        updatedById: adminId,
      },
    })

    await prisma.preferenceAuditLog.create({
      data: {
        userId,
        action: 'CONFIRMED',
        key: validated.key,
        confidence: validated.confidence ?? null,
        changedById: adminId,
        changedByName: adminName,
      },
    })

    return NextResponse.json({
      id: pref.id,
      key: pref.key,
      source: pref.source,
      updatedAt: pref.updatedAt,
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: err.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Bestätigen des Vorschlags:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
