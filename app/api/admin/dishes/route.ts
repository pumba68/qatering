import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const dishSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  calories: z.number().optional().nullable(),
  protein: z.number().optional().nullable(),
  carbs: z.number().optional().nullable(),
  fat: z.number().optional().nullable(),
  allergens: z.array(z.string()).optional(),
  dietTags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET: Alle Gerichte abrufen; ?sort=popular&limit=5 = Top 5 nach Bestellanzahl
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const sort = searchParams.get('sort')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 5, 20) : undefined

    if (sort === 'popular' && limit) {
      const byMenuItem = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: { quantity: true },
      })
      const menuItemIds = byMenuItem.map((p) => p.menuItemId)
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true, dishId: true },
      })
      const menuItemToQuantity = new Map(
        byMenuItem.map((p) => [p.menuItemId, p._sum.quantity ?? 0])
      )
      const dishIdToCount = new Map<string, number>()
      menuItems.forEach((mi) => {
        const qty = menuItemToQuantity.get(mi.id) ?? 0
        if (mi.dishId) {
          dishIdToCount.set(mi.dishId, (dishIdToCount.get(mi.dishId) ?? 0) + qty)
        }
      })
      const sortedDishIds = Array.from(dishIdToCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, limit)

      const popularDishes = await prisma.dish.findMany({
        where: {
          id: { in: sortedDishIds },
          ...(includeInactive ? {} : { isActive: true }),
        },
      })
      const orderByPopular = new Map(
        sortedDishIds.map((id, i) => [id, i])
      )
      popularDishes.sort(
        (a, b) => (orderByPopular.get(a.id) ?? 99) - (orderByPopular.get(b.id) ?? 99)
      )

      if (popularDishes.length < limit) {
        const existingIds = new Set(popularDishes.map((d) => d.id))
        const fill = await prisma.dish.findMany({
          where: {
            id: { notIn: Array.from(existingIds) },
            ...(includeInactive ? {} : { isActive: true }),
          },
          orderBy: { name: 'asc' },
          take: limit - popularDishes.length,
        })
        return NextResponse.json([...popularDishes, ...fill])
      }
      return NextResponse.json(popularDishes)
    }

    const dishes = await prisma.dish.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(dishes)
  } catch (error) {
    console.error('Fehler beim Abrufen der Gerichte:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neues Gericht erstellen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = dishSchema.parse(body)

    const dish = await prisma.dish.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        imageUrl: validatedData.imageUrl || null,
        category: validatedData.category || null,
        calories: validatedData.calories || null,
        protein: validatedData.protein || null,
        carbs: validatedData.carbs || null,
        fat: validatedData.fat || null,
        allergens: validatedData.allergens || [],
        dietTags: validatedData.dietTags || [],
        isActive: validatedData.isActive ?? true,
      },
    })

    return NextResponse.json(dish, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen des Gerichts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
