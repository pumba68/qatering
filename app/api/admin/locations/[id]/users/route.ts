export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET /api/admin/locations/[id]/users – alle zugewiesenen Mitarbeiter mit Standort-Rolle */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id: locationId } = await params

    // Org-Check: Location muss zur selben Org gehören
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { organizationId: true },
    })
    if (!location) return NextResponse.json({ error: 'Standort nicht gefunden.' }, { status: 404 })
    if (ctx.organizationId && location.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    }

    const assignments = await prisma.userLocation.findMany({
      where: { locationId },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Fehler GET location users:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/** POST /api/admin/locations/[id]/users – Mitarbeiter hinzufügen */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id: locationId } = await params

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { organizationId: true },
    })
    if (!location) return NextResponse.json({ error: 'Standort nicht gefunden.' }, { status: 404 })
    if (ctx.organizationId && location.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, role } = body

    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'userId fehlt.' }, { status: 400 })
    }
    const validRoles = ['KITCHEN_STAFF', 'LOCATION_ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
    }

    // Sicherstellen, dass User zur selben Org gehört
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })
    if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 })
    if (ctx.organizationId && user.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Nutzer gehört nicht zur selben Organisation.' }, { status: 403 })
    }

    const assignment = await prisma.userLocation.upsert({
      where: { userId_locationId: { userId, locationId } },
      create: { userId, locationId, role },
      update: { role },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Fehler POST location user:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
