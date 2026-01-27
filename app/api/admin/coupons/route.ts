import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const couponSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich').max(50, 'Code zu lang'),
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional().nullable(),
  type: z.enum(['DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'FREE_ITEM']),
  discountValue: z.number().optional().nullable(),
  freeItemDishId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(), // ISO string
  endDate: z.string().optional().nullable(), // ISO string
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().default(1),
  minOrderAmount: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

// GET: Alle Coupons abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (locationId) {
      where.locationId = locationId
    }
    if (!includeInactive) {
      where.isActive = true
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        freeItemDish: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Fehler beim Abrufen der Coupons:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neuen Coupon erstellen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = couponSchema.parse(body)

    // Prüfe ob Code bereits existiert
    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ein Coupon mit dem Code "${validated.code}" existiert bereits.` },
        { status: 409 }
      )
    }

    // Validiere Typ-spezifische Felder
    if (validated.type === 'DISCOUNT_PERCENTAGE' || validated.type === 'DISCOUNT_FIXED') {
      if (!validated.discountValue || validated.discountValue <= 0) {
        return NextResponse.json(
          { error: 'Rabattwert ist erforderlich und muss größer als 0 sein.' },
          { status: 400 }
        )
      }
      if (validated.type === 'DISCOUNT_PERCENTAGE' && validated.discountValue > 100) {
        return NextResponse.json(
          { error: 'Prozentrabatt darf nicht größer als 100% sein.' },
          { status: 400 }
        )
      }
    }

    if (validated.type === 'FREE_ITEM' && !validated.freeItemDishId) {
      return NextResponse.json(
        { error: 'Für kostenlose Artikel muss ein Gericht ausgewählt werden.' },
        { status: 400 }
      )
    }

    // Prüfe ob Gericht existiert (für FREE_ITEM)
    if (validated.freeItemDishId) {
      const dish = await prisma.dish.findUnique({
        where: { id: validated.freeItemDishId },
      })
      if (!dish) {
        return NextResponse.json(
          { error: 'Ausgewähltes Gericht existiert nicht.' },
          { status: 404 }
        )
      }
    }

    // Prüfe ob Location existiert (falls angegeben)
    if (validated.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: validated.locationId },
      })
      if (!location) {
        return NextResponse.json(
          { error: 'Ausgewählte Location existiert nicht.' },
          { status: 404 }
        )
      }
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code.toUpperCase(),
        name: validated.name,
        description: validated.description,
        type: validated.type,
        discountValue: validated.discountValue,
        freeItemDishId: validated.freeItemDishId,
        locationId: validated.locationId,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        maxUses: validated.maxUses,
        maxUsesPerUser: validated.maxUsesPerUser,
        minOrderAmount: validated.minOrderAmount,
        isActive: validated.isActive ?? true,
      },
      include: {
        freeItemDish: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Erstellen des Coupons:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
