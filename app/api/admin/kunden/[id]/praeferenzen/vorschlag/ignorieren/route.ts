export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  key: z.string().min(1).max(100),
})

/**
 * POST /api/admin/kunden/[id]/praeferenzen/vorschlag/ignorieren
 *
 * Markiert einen automatisch abgeleiteten Diät-Vorschlag als ignoriert.
 * Persistiert einen DERIVED+ignored=true Eintrag, damit der Vorschlag
 * nicht wieder angezeigt wird. Kein Audit-Log (keine sensible Aktion).
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

    await prisma.customerPreference.upsert({
      where: { userId_key: { userId, key: validated.key } },
      create: {
        userId,
        type: 'EXPLICIT',
        key: validated.key,
        source: 'DERIVED',
        ignored: true,
        updatedById: adminId,
      },
      update: {
        ignored: true,
        updatedById: adminId,
      },
    })

    return NextResponse.json({ message: 'Vorschlag ignoriert' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: err.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Ignorieren des Vorschlags:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
