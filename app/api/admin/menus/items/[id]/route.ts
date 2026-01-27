import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const menuItemUpdateSchema = z.object({
  dishId: z.string().optional(),
  date: z.string().datetime().optional(),
  price: z.number().positive().optional(),
  maxOrders: z.number().int().positive().optional().nullable(),
  available: z.boolean().optional(),
  currentOrders: z.number().int().min(0).optional(),
})

// PATCH: MenuItem bearbeiten (z.B. Datum, Preis)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = menuItemUpdateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.dishId !== undefined) updateData.dishId = validatedData.dishId
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date)
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.maxOrders !== undefined) updateData.maxOrders = validatedData.maxOrders
    if (validatedData.available !== undefined) updateData.available = validatedData.available
    if (validatedData.currentOrders !== undefined) updateData.currentOrders = validatedData.currentOrders

    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        dish: true,
      },
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren des MenuItems:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: MenuItem entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    // Prüfen ob bereits Bestellungen existieren
    const orderItems = await prisma.orderItem.findMany({
      where: { menuItemId: params.id },
    })

    if (orderItems.length > 0) {
      return NextResponse.json(
        { error: 'Gericht kann nicht entfernt werden, da bereits Bestellungen existieren' },
        { status: 400 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'MenuItem gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des MenuItems:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
