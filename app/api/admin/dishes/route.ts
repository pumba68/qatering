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

// GET: Alle Gerichte abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

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
