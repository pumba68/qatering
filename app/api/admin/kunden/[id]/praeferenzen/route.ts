export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ─── Config ────────────────────────────────────────────────────────────────────

const MIN_ORDERS_FOR_SUGGESTIONS = 5
const CONFIDENCE_THRESHOLD = 0.7
const WINDOW_DAYS = 90

// Valid preference keys — correspond to Metadata seeds
const VALID_ALLERGEN_KEYS = [
  'ALLERGEN_GLUTEN', 'ALLERGEN_CRUSTACEANS', 'ALLERGEN_EGGS', 'ALLERGEN_FISH',
  'ALLERGEN_PEANUTS', 'ALLERGEN_SOYBEANS', 'ALLERGEN_MILK', 'ALLERGEN_TREE_NUTS',
  'ALLERGEN_CELERY', 'ALLERGEN_MUSTARD', 'ALLERGEN_SESAME', 'ALLERGEN_SULPHITES',
  'ALLERGEN_LUPIN', 'ALLERGEN_MOLLUSCS', 'ALLERGEN_CUSTOM',
] as const

const VALID_DIET_KEYS = [
  'DIET_VEGETARIAN', 'DIET_VEGAN', 'DIET_HALAL', 'DIET_KOSHER',
  'DIET_GLUTEN_FREE', 'DIET_LACTOSE_FREE', 'DIET_LOW_CARB', 'DIET_KETO',
] as const

const VALID_KEYS = [...VALID_ALLERGEN_KEYS, ...VALID_DIET_KEYS]
type ValidKey = typeof VALID_ALLERGEN_KEYS[number] | typeof VALID_DIET_KEYS[number]

const addPreferenceSchema = z.object({
  key: z.string().refine(
    (k): k is ValidKey => VALID_KEYS.includes(k as ValidKey),
    { message: 'Ungültiger Präferenz-Schlüssel' }
  ),
  value: z.string().max(500).trim().optional().nullable(),
})

// ─── Helper: verify customer belongs to org ────────────────────────────────────

async function verifyCustomer(userId: string, organizationId: string) {
  return prisma.user.findFirst({
    where: { id: userId, organizationId, role: 'CUSTOMER' },
    select: { id: true },
  })
}

// ─── GET ───────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/kunden/[id]/praeferenzen
 *
 * Returns:
 *   explicit    — explizite Präferenzen (source != DERIVED oder source = DERIVED + confirmed)
 *   suggestions — live-berechnete Diät-Vorschläge basierend auf Bestellhistorie
 *   implicit    — Verhaltensstatistiken (Top-Kategorien, Produkte, Kanal, Uhrzeit)
 *   auditLog    — Letzte 10 Admin-Änderungen
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error
    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    const customer = await verifyCustomer(userId, organizationId)
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const since = new Date()
    since.setDate(since.getDate() - WINDOW_DAYS)

    // Fetch all in parallel
    const [allPrefs, auditLog, recentOrders] = await Promise.all([
      prisma.customerPreference.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.preferenceAuditLog.findMany({
        where: { userId },
        orderBy: { changedAt: 'desc' },
        take: 10,
      }),
      prisma.order.findMany({
        where: { userId, createdAt: { gte: since } },
        select: {
          id: true,
          channel: true,
          createdAt: true,
          items: {
            select: {
              productNameSnapshot: true,
              productCategorySnapshot: true,
              menuItem: {
                select: {
                  dish: { select: { dietTags: true, category: true } },
                },
              },
            },
          },
        },
      }),
    ])

    // ── Explizite Präferenzen: nur USER, ADMIN, SYSTEM (kein DERIVED – die kommen in suggestions)
    const explicit = allPrefs
      .filter(p => p.source !== 'DERIVED')
      .map(p => ({
        id: p.id,
        type: p.type,
        key: p.key,
        value: p.value,
        source: p.source,
        confidence: p.confidence ? Number(p.confidence) : null,
        updatedAt: p.updatedAt,
      }))

    // ── Einmaliger Pass über alle Bestellungen: dietTags + Kategorien + Statistik-Daten
    const totalOrders = recentOrders.length

    // Order-level tracking (1 Bestellung = max. 1 Zählung pro Tag/Kategorie)
    const tagOrderIds: Record<string, Set<string>> = {}   // dietTag → Set<orderId>
    const catOrderIds: Record<string, Set<string>> = {}   // category → Set<orderId>

    // Item-level tracking (für Statistik-Anzeige)
    const prodCount: Record<string, number> = {}
    const channelCount: Record<string, number> = {}
    const timeSlotCount: Record<string, number> = {
      BREAKFAST: 0, LUNCH: 0, AFTERNOON: 0, EVENING: 0,
    }

    for (const order of recentOrders) {
      const ch = order.channel ?? 'APP'
      channelCount[ch] = (channelCount[ch] ?? 0) + 1

      const hour = new Date(order.createdAt).getHours()
      if (hour < 10)      timeSlotCount.BREAKFAST++
      else if (hour < 14) timeSlotCount.LUNCH++
      else if (hour < 17) timeSlotCount.AFTERNOON++
      else                timeSlotCount.EVENING++

      // Collect unique tags + categories per order (order-level counting)
      const tagsInOrder = new Set<string>()
      const catsInOrder = new Set<string>()

      for (const item of order.items) {
        // dietTags
        for (const tag of item.menuItem?.dish?.dietTags ?? []) {
          tagsInOrder.add(tag.toLowerCase().trim())
        }
        // category: prefer snapshot, fallback to dish.category
        const cat = item.productCategorySnapshot ?? item.menuItem?.dish?.category ?? null
        if (cat) catsInOrder.add(cat.trim())

        // product names (item-level for statistics)
        if (item.productNameSnapshot) {
          prodCount[item.productNameSnapshot] = (prodCount[item.productNameSnapshot] ?? 0) + 1
        }
      }

      for (const tag of Array.from(tagsInOrder)) {
        if (!tagOrderIds[tag]) tagOrderIds[tag] = new Set()
        tagOrderIds[tag].add(order.id)
      }
      for (const cat of Array.from(catsInOrder)) {
        if (!catOrderIds[cat]) catOrderIds[cat] = new Set()
        catOrderIds[cat].add(order.id)
      }
    }

    // ── Konfidenzbasierte Vorschläge (Schwelle ≥70%, noch nicht bestätigt/ignoriert)
    const confirmedKeys = new Set(allPrefs.filter(p => p.source !== 'DERIVED').map(p => p.key))
    const ignoredKeys = new Set(allPrefs.filter(p => p.ignored).map(p => p.key))

    const suggestions: Array<{
      key: string
      label: string
      confidence: number
      orderCount: number
      matchingOrderCount: number
    }> = []

    if (totalOrders >= MIN_ORDERS_FOR_SUGGESTIONS) {
      for (const [tag, orderIds] of Object.entries(tagOrderIds)) {
        const confidence = orderIds.size / totalOrders
        if (confidence < CONFIDENCE_THRESHOLD) continue
        const key = `DIET_${tag.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`
        if (confirmedKeys.has(key) || ignoredKeys.has(key)) continue
        suggestions.push({
          key,
          label: tag,
          confidence: Math.round(confidence * 1000) / 1000,
          orderCount: totalOrders,
          matchingOrderCount: orderIds.size,
        })
      }
      suggestions.sort((a, b) => b.confidence - a.confidence)
    }

    // ── Vollständiges Likelihood-Profil (ALLE Tags/Kategorien, kein Threshold)
    // Minimum 5% score, um Rauschen herauszufiltern
    const LIKELYHOOD_MIN = 0.05

    const dietProfile = Object.entries(tagOrderIds)
      .map(([tag, orderIds]) => {
        const score = orderIds.size / totalOrders
        const key = `DIET_${tag.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`
        return {
          key,
          label: tag.charAt(0).toUpperCase() + tag.slice(1),
          score: Math.round(score * 1000) / 1000,
          matchCount: orderIds.size,
          totalOrders,
        }
      })
      .filter(d => d.score >= LIKELYHOOD_MIN)
      .sort((a, b) => b.score - a.score)

    const categoryProfile = Object.entries(catOrderIds)
      .map(([name, orderIds]) => {
        const score = orderIds.size / totalOrders
        return {
          name,
          score: Math.round(score * 1000) / 1000,
          matchCount: orderIds.size,
          totalOrders,
        }
      })
      .filter(c => c.score >= LIKELYHOOD_MIN)
      .sort((a, b) => b.score - a.score)

    // ── Implizite Verhaltensstatistiken (Top 5 für Statistik-Anzeige)
    const topProducts = Object.entries(prodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // topCategories jetzt aus order-level catOrderIds (semantisch korrekter: % der Bestellungen)
    const topCategories = categoryProfile.slice(0, 5).map(c => ({
      name: c.name,
      count: c.matchCount,
      pct: Math.round(c.score * 100),
    }))

    const preferredChannel = Object.entries(channelCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const preferredTimeSlot = Object.entries(timeSlotCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return NextResponse.json({
      explicit,
      suggestions,
      likelyhood: {
        totalOrders,
        windowDays: WINDOW_DAYS,
        dietProfile,
        categoryProfile,
      },
      implicit: {
        orderCount: totalOrders,
        windowDays: WINDOW_DAYS,
        topCategories,
        topProducts,
        preferredChannel,
        preferredTimeSlot,
      },
      auditLog: auditLog.map(l => ({
        id: l.id,
        action: l.action,
        key: l.key,
        value: l.value,
        confidence: l.confidence ? Number(l.confidence) : null,
        changedByName: l.changedByName,
        changedAt: l.changedAt,
      })),
    })
  } catch (err) {
    console.error('Fehler beim Abrufen der Präferenzen:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/kunden/[id]/praeferenzen
 * Fügt eine explizite Präferenz hinzu (Admin). Erzeugt Audit-Eintrag ADDED.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId, user: adminUser } = await getAdminContext()
    if (error) return error
    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id: userId } = await params

    const customer = await verifyCustomer(userId, organizationId)
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const validated = addPreferenceSchema.parse(body)

    const adminId = (adminUser as { id?: string }).id ?? ''
    const adminName = (adminUser as { name?: string }).name ?? 'Admin'

    // Check if already explicitly set (non-DERIVED)
    const existing = await prisma.customerPreference.findUnique({
      where: { userId_key: { userId, key: validated.key } },
    })
    if (existing && existing.source !== 'DERIVED') {
      return NextResponse.json(
        { error: 'Diese Präferenz ist für diesen Kunden bereits hinterlegt.' },
        { status: 409 }
      )
    }

    const pref = await prisma.customerPreference.upsert({
      where: { userId_key: { userId, key: validated.key } },
      create: {
        userId,
        type: 'EXPLICIT',
        key: validated.key,
        value: validated.value ?? null,
        source: 'ADMIN',
        ignored: false,
        updatedById: adminId,
      },
      update: {
        type: 'EXPLICIT',
        value: validated.value ?? null,
        source: 'ADMIN',
        ignored: false,
        confidence: null,
        updatedById: adminId,
      },
    })

    await prisma.preferenceAuditLog.create({
      data: {
        userId,
        action: 'ADDED',
        key: validated.key,
        value: validated.value ?? null,
        changedById: adminId,
        changedByName: adminName,
      },
    })

    return NextResponse.json({
      id: pref.id,
      key: pref.key,
      value: pref.value,
      source: pref.source,
      updatedAt: pref.updatedAt,
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: err.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Hinzufügen der Präferenz:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
