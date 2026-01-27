import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

// GET: Einzelnes Menü mit allen MenuItems abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const menu = await prisma.menu.findUnique({
      where: { id: params.menuId },
      include: {
        menuItems: {
          include: {
            dish: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
        location: true,
      },
    })

    if (!menu) {
      return NextResponse.json(
        { error: 'Menü nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Fehler beim Abrufen des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Menü aktualisieren (z.B. isPublished)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const { isPublished } = body

    const menu = await prisma.menu.update({
      where: { id: params.menuId },
      data: {
        isPublished: isPublished ?? undefined,
      },
      include: {
        menuItems: {
          include: {
            dish: true,
          },
        },
      },
    })

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
