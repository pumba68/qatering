export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { z } from 'zod'

// Valid preference keys (from admin preferences)
const VALID_ALLERGEN_KEYS = [
  'ALLERGEN_GLUTEN',
  'ALLERGEN_CRUSTACEANS',
  'ALLERGEN_EGGS',
  'ALLERGEN_FISH',
  'ALLERGEN_PEANUTS',
  'ALLERGEN_SOYBEANS',
  'ALLERGEN_MILK',
  'ALLERGEN_TREE_NUTS',
  'ALLERGEN_CELERY',
  'ALLERGEN_MUSTARD',
  'ALLERGEN_SESAME',
  'ALLERGEN_SULPHITES',
  'ALLERGEN_LUPIN',
  'ALLERGEN_MOLLUSCS',
  'ALLERGEN_CUSTOM',
] as const

const VALID_DIET_KEYS = [
  'DIET_VEGETARIAN',
  'DIET_VEGAN',
  'DIET_HALAL',
  'DIET_KOSHER',
  'DIET_GLUTEN_FREE',
  'DIET_LACTOSE_FREE',
  'DIET_LOW_CARB',
  'DIET_KETO',
] as const

const VALID_KEYS = [...VALID_ALLERGEN_KEYS, ...VALID_DIET_KEYS]
type ValidKey = typeof VALID_ALLERGEN_KEYS[number] | typeof VALID_DIET_KEYS[number]

const togglePreferenceSchema = z.object({
  key: z.string().refine(
    (k): k is ValidKey => VALID_KEYS.includes(k as ValidKey),
    { message: 'Ungültiger Präferenz-Schlüssel' }
  ),
  active: z.boolean(),
})

/**
 * GET /api/profil/praeferenzen
 * Returns all preferences: explicit + derived suggestions
 */
export async function GET() {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const allPrefs = await prisma.customerPreference.findMany({
      where: { userId },
      select: {
        id: true,
        key: true,
        type: true,
        source: true,
        confidence: true,
        ignored: true,
      },
    })

    const explicit = allPrefs.filter((p) => p.source !== 'DERIVED' && !p.ignored)
    const derived = allPrefs.filter(
      (p) =>
        p.source === 'DERIVED' &&
        !p.ignored &&
        !explicit.some((e) => e.key === p.key)
    )

    return NextResponse.json({
      explicit: explicit.map((p) => ({
        id: p.id,
        key: p.key,
        type: p.type,
        source: p.source,
      })),
      derived: derived.map((p) => ({
        id: p.id,
        key: p.key,
        confidence: p.confidence ? Number(p.confidence) : null,
      })),
    })
  } catch (error) {
    console.error('Fehler beim Abrufen von Präferenzen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/**
 * POST /api/profil/praeferenzen
 * Toggle explicit preference (create/update EXPLICIT with source=USER)
 */
export async function POST(request: NextRequest) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const body = await request.json()
    const { key, active } = togglePreferenceSchema.parse(body)

    if (active) {
      // Create or update to EXPLICIT/USER
      const pref = await prisma.customerPreference.upsert({
        where: { userId_key: { userId, key } },
        create: {
          userId,
          key,
          type: 'EXPLICIT',
          source: 'USER',
          ignored: false,
        },
        update: {
          type: 'EXPLICIT',
          source: 'USER',
          ignored: false,
        },
        select: { id: true, key: true, type: true },
      })
      return NextResponse.json({ success: true, preference: pref })
    } else {
      // Mark as ignored instead of deleting
      await prisma.customerPreference.updateMany({
        where: { userId, key },
        data: { ignored: true },
      })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler beim Toggle der Präferenz:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
