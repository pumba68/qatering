import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/
const menuItemSchema = z.object({
  menuId: z.string(),
  dishId: z.string(),
  date: z.string().min(1),
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

    // Kalendertag eindeutig speichern: YYYY-MM-DD = genau dieser Tag 12:00 UTC; ISO = UTC-Datum daraus, 12:00 UTC
    // (vermeidet Zeitzonen-Verschiebung bei Kunde und in Filtern)
    let dateObj: Date
    if (dateOnlyRegex.test(validatedData.date)) {
      const [y, m, d] = validatedData.date.split('-').map(Number)
      dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
    } else {
      const parsed = new Date(validatedData.date)
      const y = parsed.getUTCFullYear()
      const m = parsed.getUTCMonth()
      const d = parsed.getUTCDate()
      dateObj = new Date(Date.UTC(y, m, d, 12, 0, 0, 0))
    }

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
