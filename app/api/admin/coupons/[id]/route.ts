import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateCouponSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'FREE_ITEM']).optional(),
  discountValue: z.number().optional().nullable(),
  freeItemDishId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional(),
  minOrderAmount: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
})

// GET: Einzelnen Coupon abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
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
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Fehler beim Abrufen des Coupons:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Coupon aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = updateCouponSchema.parse(body)

    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon nicht gefunden' },
        { status: 404 }
      )
    }

    // Validiere Typ-spezifische Felder wenn Typ geändert wird
    if (validated.type) {
      if ((validated.type === 'DISCOUNT_PERCENTAGE' || validated.type === 'DISCOUNT_FIXED') && 
          (!validated.discountValue || validated.discountValue <= 0)) {
        return NextResponse.json(
          { error: 'Rabattwert ist erforderlich und muss größer als 0 sein.' },
          { status: 400 }
        )
      }
      if (validated.type === 'FREE_ITEM' && !validated.freeItemDishId) {
        return NextResponse.json(
          { error: 'Für kostenlose Artikel muss ein Gericht ausgewählt werden.' },
          { status: 400 }
        )
      }
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
    if (validated.locationId !== undefined) {
      if (validated.locationId && validated.locationId !== null) {
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
    }

    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.discountValue !== undefined) updateData.discountValue = validated.discountValue
    if (validated.freeItemDishId !== undefined) updateData.freeItemDishId = validated.freeItemDishId
    if (validated.locationId !== undefined) updateData.locationId = validated.locationId
    if (validated.startDate !== undefined) updateData.startDate = validated.startDate ? new Date(validated.startDate) : null
    if (validated.endDate !== undefined) updateData.endDate = validated.endDate ? new Date(validated.endDate) : null
    if (validated.maxUses !== undefined) updateData.maxUses = validated.maxUses
    if (validated.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = validated.maxUsesPerUser
    if (validated.minOrderAmount !== undefined) updateData.minOrderAmount = validated.minOrderAmount
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
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
    })

    return NextResponse.json(coupon)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Coupons:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Coupon löschen (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon nicht gefunden' },
        { status: 404 }
      )
    }

    // Soft Delete: Setze isActive auf false
    await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Coupon erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Coupons:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
