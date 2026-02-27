export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

async function resolveAndCheck(locationId: string, ctx: Awaited<ReturnType<typeof getAdminContext>>) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { organizationId: true, name: true },
  })
  if (!location) return { error: NextResponse.json({ error: 'Standort nicht gefunden.' }, { status: 404 }) }
  if (ctx.organizationId && location.organizationId !== ctx.organizationId) {
    return { error: NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 }) }
  }
  return { location }
}

/** PUT /api/admin/locations/[id]/users/[userId] – Standort-Rolle ändern */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id: locationId, userId } = await params
    const { error } = await resolveAndCheck(locationId, ctx)
    if (error) return error

    const body = await req.json()
    const validRoles = ['KITCHEN_STAFF', 'LOCATION_ADMIN']
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
    }

    const updated = await prisma.userLocation.update({
      where: { userId_locationId: { userId, locationId } },
      data: { role: body.role },
      select: { userId: true, role: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Fehler PUT location user role:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/** DELETE /api/admin/locations/[id]/users/[userId] – Mitarbeiter entfernen */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id: locationId, userId } = await params
    const { error } = await resolveAndCheck(locationId, ctx)
    if (error) return error

    await prisma.userLocation.delete({
      where: { userId_locationId: { userId, locationId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler DELETE location user:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
