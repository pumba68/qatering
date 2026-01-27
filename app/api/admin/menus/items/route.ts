import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const menuItemSchema = z.object({
  menuId: z.string(),
  dishId: z.string(),
  date: z.string().datetime(),
  price: z.number().positive(),
  maxOrders: z.number().int().positive().optional().nullable(),
  available: z.boolean().optional(),
})

// POST: MenuItem zum Menü hinzufügen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = menuItemSchema.parse(body)

    // Stelle sicher, dass das Datum korrekt gesetzt wird (lokale Mitternacht)
    const dateObj = new Date(validatedData.date)
    // Normalisiere auf Mitternacht in lokaler Zeitzone
    dateObj.setHours(0, 0, 0, 0)

    console.log('Creating MenuItem:', {
      menuId: validatedData.menuId,
      dishId: validatedData.dishId,
      date: dateObj.toISOString(),
      dateLocal: dateObj.toLocaleString('de-DE'),
      price: validatedData.price,
    })

    const menuItem = await prisma.menuItem.create({
      data: {
        menuId: validatedData.menuId,
        dishId: validatedData.dishId,
        date: dateObj,
        price: validatedData.price,
        maxOrders: validatedData.maxOrders || null,
        available: validatedData.available ?? true,
        currentOrders: 0,
      },
      include: {
        dish: true,
      },
    })

    console.log('MenuItem created successfully:', {
      id: menuItem.id,
      date: menuItem.date.toISOString(),
      dateLocal: menuItem.date.toLocaleString('de-DE'),
      dishName: menuItem.dish.name,
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Prisma Fehler: Duplicate
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Dieses Gericht ist bereits für diesen Tag zugewiesen' },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen des MenuItems:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
