import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const metadataSchema = z.object({
  type: z.enum(['DIET_CATEGORY', 'ALLERGEN', 'DISH_CATEGORY']),
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

// GET: Alle Metadaten abrufen (optional gefiltert nach Typ)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'DIET_CATEGORY' | 'ALLERGEN' | 'DISH_CATEGORY' | null
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (!includeInactive) {
      where.isActive = true
    }

    const metadata = await prisma.metadata.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Fehler beim Abrufen der Metadaten:', error)
    // Gebe leeres Array zurück statt Fehler, damit die Seite nicht abstürzt
    return NextResponse.json([])
  }
}

// POST: Neue Metadaten erstellen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = metadataSchema.parse(body)

    // Prüfe ob bereits existiert
    const existing = await prisma.metadata.findUnique({
      where: {
        type_name: {
          type: validated.type,
          name: validated.name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ein Eintrag mit dem Namen "${validated.name}" existiert bereits für diesen Typ.` },
        { status: 409 }
      )
    }

    // Setze sortOrder falls nicht angegeben (nächste freie Nummer)
    let sortOrder = validated.sortOrder
    if (sortOrder === undefined) {
      const maxOrder = await prisma.metadata.findFirst({
        where: { type: validated.type },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })
      sortOrder = (maxOrder?.sortOrder ?? -1) + 1
    }

    const metadata = await prisma.metadata.create({
      data: {
        ...validated,
        sortOrder,
      },
    })

    return NextResponse.json(metadata, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Erstellen der Metadaten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
