import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateMetadataSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

// GET: Einzelne Metadaten abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const metadata = await prisma.metadata.findUnique({
      where: { id: params.id },
    })

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadaten nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Fehler beim Abrufen der Metadaten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Metadaten aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = updateMetadataSchema.parse(body)

    // Prüfe ob Metadaten existiert
    const existing = await prisma.metadata.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Metadaten nicht gefunden' },
        { status: 404 }
      )
    }

    // Wenn Name geändert wird, prüfe auf Duplikate
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.metadata.findUnique({
        where: {
          type_name: {
            type: existing.type,
            name: validated.name,
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: `Ein Eintrag mit dem Namen "${validated.name}" existiert bereits für diesen Typ.` },
          { status: 409 }
        )
      }
    }

    const metadata = await prisma.metadata.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json(metadata)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren der Metadaten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Metadaten löschen (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const existing = await prisma.metadata.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Metadaten nicht gefunden' },
        { status: 404 }
      )
    }

    // Soft Delete: Setze isActive auf false
    await prisma.metadata.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Metadaten erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Metadaten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
