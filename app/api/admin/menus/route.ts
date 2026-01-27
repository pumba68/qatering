import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const menuSchema = z.object({
  locationId: z.string(),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
})

// Helper: Kalenderwoche berechnen
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// GET: Alle Menüs abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const year = searchParams.get('year')

    const where: any = {}
    if (locationId) where.locationId = locationId
    if (year) where.year = parseInt(year)

    const menus = await prisma.menu.findMany({
      where,
      include: {
        menuItems: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: {
        weekNumber: 'desc',
      },
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Fehler beim Abrufen der Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neues Menü erstellen oder existierendes aktualisieren
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const { locationId, weekNumber, year, isPublished } = body

    if (!locationId || !weekNumber || !year) {
      return NextResponse.json(
        { error: 'locationId, weekNumber und year sind erforderlich' },
        { status: 400 }
      )
    }

    // Start und Enddatum der Woche berechnen
    const date = new Date(year, 0, 1)
    const daysToAdd = (weekNumber - 1) * 7
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() + daysToAdd - date.getDay() + 1) // Montag
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sonntag

    // Check if location exists
    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    })

    if (!locationExists) {
      return NextResponse.json(
        { error: `Location '${locationId}' existiert nicht. Bitte führen Sie 'npm run db:seed' aus.` },
        { status: 400 }
      )
    }

    const menu = await prisma.menu.upsert({
      where: {
        locationId_weekNumber_year: {
          locationId,
          weekNumber: parseInt(weekNumber),
          year: parseInt(year),
        },
      },
      update: {
        isPublished: isPublished ?? false,
      },
      create: {
        locationId,
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        startDate: startOfWeek,
        endDate: endOfWeek,
        isPublished: isPublished ?? false,
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
    console.error('Fehler beim Erstellen/Aktualisieren des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
