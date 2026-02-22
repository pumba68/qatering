export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VALID_IDENTIFIER_TYPES = ['APP_ID', 'EMPLOYEE_ID', 'BADGE_ID', 'DEVICE_ID', 'EXTERNAL_ID'] as const

const createIdentifierSchema = z.object({
  type: z.enum(VALID_IDENTIFIER_TYPES, {
    errorMap: () => ({ message: `Typ muss einer von ${VALID_IDENTIFIER_TYPES.join(', ')} sein` }),
  }),
  value: z.string().min(1, 'Wert darf nicht leer sein').max(500, 'Wert zu lang (max. 500 Zeichen)').trim(),
  source: z.string().max(200, 'Quelle zu lang (max. 200 Zeichen)').trim().optional().nullable(),
})

/**
 * POST /api/admin/kunden/[id]/identifiers
 * Fügt einem Kunden einen neuen Identifikator hinzu.
 * Nur Admins der gleichen Organisation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error

    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    // Sicherstellen: Kunde gehört zur selben Org
    const customer = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: 'CUSTOMER' },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    // Body parsen + validieren
    const body = await req.json()
    const validated = createIdentifierSchema.parse(body)

    // Duplikat prüfen: gleicher Typ + Wert für diesen Kunden bereits aktiv?
    const duplicate = await prisma.customerIdentifier.findFirst({
      where: {
        userId,
        type: validated.type,
        value: validated.value,
        isActive: true,
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Dieser Identifikator (Typ + Wert) ist für diesen Kunden bereits hinterlegt.' },
        { status: 409 }
      )
    }

    const identifier = await prisma.customerIdentifier.create({
      data: {
        userId,
        type: validated.type,
        value: validated.value,
        source: validated.source ?? null,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        value: true,
        source: true,
        isActive: true,
        addedAt: true,
      },
    })

    return NextResponse.json(identifier, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Anlegen des Identifikators:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
