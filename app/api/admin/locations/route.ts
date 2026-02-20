export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET: Standorte der Organisation (für Dropdowns oder Admin-Übersicht). includeInactive=true liefert auch inaktive. */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: { organizationId?: string; isActive?: boolean; id?: { in: string[] } } = {}
    if (ctx.organizationId) where.organizationId = ctx.organizationId
    if (!includeInactive) where.isActive = true
    if (ctx.allowedLocationIds !== null) where.id = { in: ctx.allowedLocationIds ?? [] }

    const locations = await prisma.location.findMany({
      where,
      select: { id: true, name: true, address: true, phone: true, email: true, openingHours: true, workingDays: true, isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Fehler beim Abrufen der Locations:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** POST: Neue Location anlegen (Organisation des Users; SUPER_ADMIN kann organizationId im Body übergeben). */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const userRole = (ctx.user as { role?: string })?.role
    let organizationId = ctx.organizationId ?? null
    if (userRole === 'SUPER_ADMIN' && typeof body.organizationId === 'string') {
      organizationId = body.organizationId
    }
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet. In der Nutzerverwaltung diesem Nutzer eine Organisation (Kantine) zuweisen, dann können Standorte angelegt werden.' },
        { status: 403 }
      )
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Name ist Pflichtfeld.' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim() : null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ungültiges E-Mail-Format.' }, { status: 400 })
    }

    const location = await prisma.location.create({
      data: {
        organizationId,
        name,
        address: typeof body.address === 'string' ? body.address.trim() || null : null,
        phone: typeof body.phone === 'string' ? body.phone.trim() || null : null,
        email: email || null,
        openingHours: body.openingHours && typeof body.openingHours === 'object' ? body.openingHours : null,
        workingDays: Array.isArray(body.workingDays) ? body.workingDays : undefined,
        isActive: body.isActive !== false,
      },
      select: { id: true, name: true, address: true, phone: true, email: true, openingHours: true, workingDays: true, isActive: true },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen der Location:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
