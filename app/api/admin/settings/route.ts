import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

// GET: Location Settings abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId ist erforderlich' },
        { status: 400 }
      )
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        workingDays: true,
        openingHours: true,
      },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Standort nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      locationId: location.id,
      name: location.name,
      workingDays: location.workingDays || [1, 2, 3, 4, 5], // Default: Mo-Fr
      openingHours: location.openingHours,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Settings:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Location Settings aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const { locationId, workingDays } = body

    if (!locationId || !Array.isArray(workingDays)) {
      return NextResponse.json(
        { error: 'Ungültige Daten' },
        { status: 400 }
      )
    }

    // Validiere workingDays (0-6)
    const validDays = workingDays.filter((day: number) => day >= 0 && day <= 6)
    if (validDays.length !== workingDays.length) {
      return NextResponse.json(
        { error: 'Ungültige Werktage. Erlaubt: 0-6 (Sonntag-Samstag)' },
        { status: 400 }
      )
    }

    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        workingDays: validDays,
      },
      select: {
        id: true,
        name: true,
        workingDays: true,
      },
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Settings:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}