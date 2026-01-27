import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const dishSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable(),
  calories: z.number().optional().nullable(),
  protein: z.number().optional().nullable(),
  carbs: z.number().optional().nullable(),
  fat: z.number().optional().nullable(),
  allergens: z.array(z.string()).optional(),
  dietTags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET: Einzelnes Gericht abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const dish = await prisma.dish.findUnique({
      where: { id: params.id },
    })

    if (!dish) {
      return NextResponse.json(
        { error: 'Gericht nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dish)
  } catch (error) {
    console.error('Fehler beim Abrufen des Gerichts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Gericht bearbeiten
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = dishSchema.parse(body)

    // Leere Strings zu null konvertieren
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl || null
    if (validatedData.category !== undefined) updateData.category = validatedData.category || null
    if (validatedData.calories !== undefined) updateData.calories = validatedData.calories
    if (validatedData.protein !== undefined) updateData.protein = validatedData.protein
    if (validatedData.carbs !== undefined) updateData.carbs = validatedData.carbs
    if (validatedData.fat !== undefined) updateData.fat = validatedData.fat
    if (validatedData.allergens !== undefined) updateData.allergens = validatedData.allergens
    if (validatedData.dietTags !== undefined) updateData.dietTags = validatedData.dietTags
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const dish = await prisma.dish.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(dish)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren des Gerichts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Gericht löschen (inkl. Entfernung aus allen Speiseplänen)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    // Prüfen ob bereits Bestellungen für dieses Gericht existieren
    const menuItems = await prisma.menuItem.findMany({
      where: { dishId: params.id },
      include: {
        orderItems: true,
      },
    })

    // Prüfen ob es bereits Bestellungen gibt
    const hasOrders = menuItems.some((item) => item.orderItems.length > 0)

    if (hasOrders) {
      return NextResponse.json(
        { 
          error: 'Gericht kann nicht gelöscht werden, da bereits Bestellungen dafür existieren. Bitte deaktivieren Sie es stattdessen.' 
        },
        { status: 400 }
      )
    }

    // Transaction: MenuItems löschen und dann Gericht löschen
    await prisma.$transaction(async (tx) => {
      // 1. Alle MenuItems löschen, die dieses Gericht verwenden
      await tx.menuItem.deleteMany({
        where: { dishId: params.id },
      })

      // 2. Gericht selbst löschen
      await tx.dish.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ 
      message: 'Gericht wurde endgültig gelöscht und aus allen Speiseplänen entfernt' 
    })
  } catch (error) {
    console.error('Fehler beim Löschen des Gerichts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
