import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const putSchema = z.object({
  bannerIds: z.array(z.string().cuid()).default([]),
})

// GET: Zugewiesene Promotion-Banner eines Menüs (KW) abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { menuId } = params
    if (!menuId) {
      return NextResponse.json([], { status: 200 })
    }

    try {
      const assignments = await prisma.menuPromotionBanner.findMany({
        where: { menuId },
        include: {
          promotionBanner: true,
        },
        orderBy: { sortOrder: 'asc' },
      })
      return NextResponse.json(assignments.map((a) => ({ ...a.promotionBanner, sortOrder: a.sortOrder })))
    } catch (prismaErr) {
      // Fallback: z. B. wenn Prisma-Client die Relation noch nicht kennt
      console.error('Menu-Promotion-Banner Abfrage fehlgeschlagen, leere Liste zurückgeben:', prismaErr)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Menu-Promotion-Banner:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PUT: Zugewiesene Promotion-Banner eines Menüs setzen (Reihenfolge = Array-Reihenfolge)
export async function PUT(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { menuId } = params
    const body = await request.json()
    const { bannerIds } = putSchema.parse(body)

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    })
    if (!menu) {
      return NextResponse.json(
        { error: 'Menü nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.menuPromotionBanner.deleteMany({
      where: { menuId },
    })

    if (bannerIds.length > 0) {
      await prisma.menuPromotionBanner.createMany({
        data: bannerIds.map((promotionBannerId, index) => ({
          menuId,
          promotionBannerId,
          sortOrder: index,
        })),
        skipDuplicates: true,
      })
    }

    const assignments = await prisma.menuPromotionBanner.findMany({
      where: { menuId },
      include: { promotionBanner: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(assignments.map((a) => ({ ...a.promotionBanner, sortOrder: a.sortOrder })))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Setzen der Menu-Promotion-Banner:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
