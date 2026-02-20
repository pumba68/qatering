export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET: Eine Location lesen (nur wenn berechtigt). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id },
      select: { id: true, organizationId: true, name: true, address: true, phone: true, email: true, openingHours: true, workingDays: true, isActive: true },
    })

    if (!location) {
      return NextResponse.json({ error: 'Standort nicht gefunden.' }, { status: 404 })
    }

    if (ctx.organizationId && location.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Standort.' }, { status: 403 })
    }
    if (ctx.allowedLocationIds !== null && !ctx.allowedLocationIds.includes(id)) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Standort.' }, { status: 403 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Fehler beim Abrufen der Location:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** PUT: Location aktualisieren (nur eigene Organisation, berechtigte Location). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id } = await params
    const existing = await prisma.location.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Standort nicht gefunden.' }, { status: 404 })
    }

    if (ctx.organizationId && existing.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Standort.' }, { status: 403 })
    }
    if (ctx.allowedLocationIds !== null && !ctx.allowedLocationIds.includes(id)) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Standort.' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name darf nicht leer sein.' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim() : null
    if (email !== null && email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ungültiges E-Mail-Format.' }, { status: 400 })
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(body.address !== undefined && { address: typeof body.address === 'string' ? body.address.trim() || null : null }),
        ...(body.phone !== undefined && { phone: typeof body.phone === 'string' ? body.phone.trim() || null : null }),
        ...(body.email !== undefined && { email: email || null }),
        ...(body.openingHours !== undefined && { openingHours: body.openingHours && typeof body.openingHours === 'object' ? body.openingHours : null }),
        ...(Array.isArray(body.workingDays) && { workingDays: body.workingDays }),
        ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
      },
      select: { id: true, name: true, address: true, phone: true, email: true, openingHours: true, workingDays: true, isActive: true },
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Location:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
