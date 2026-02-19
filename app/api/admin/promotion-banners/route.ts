import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  subtitle: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  couponId: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
})

// GET: Alle Promotion-Banner abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { isActive: true }

    try {
      const banners = await prisma.promotionBanner.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(banners)
    } catch (prismaErr) {
      // Fallback: z. B. wenn Prisma-Client das Modell noch nicht kennt
      console.error('Promotion-Banner Abfrage fehlgeschlagen, leere Liste zurückgeben:', prismaErr)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Promotion-Banner:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neues Promotion-Banner erstellen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = createSchema.parse(body)

    const banner = await prisma.promotionBanner.create({
      data: {
        title: validated.title,
        subtitle: validated.subtitle || null,
        imageUrl: validated.imageUrl && validated.imageUrl !== '' ? validated.imageUrl : null,
        couponId: validated.couponId && validated.couponId !== '' ? validated.couponId : null,
        isActive: validated.isActive ?? true,
      },
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Erstellen des Promotion-Banners:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
