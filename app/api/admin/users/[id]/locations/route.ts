export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext, requireAdminRole } from '@/lib/admin-helpers'

/** GET: Zugewiesene Locations eines Users (für Admin-UI). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id: userId } = await params

    const locations = await prisma.userLocation.findMany({
      where: { userId },
      select: { locationId: true, location: { select: { id: true, name: true } } },
    })

    return NextResponse.json(locations.map((ul) => ({ id: ul.location.id, name: ul.location.name })))
  } catch (error) {
    console.error('Fehler beim Abrufen der User-Locations:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** PUT: Locations eines Users setzen (nur ADMIN/KITCHEN_STAFF; nur erlaubte Locations). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { id: userId } = await params

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 })
    }

    if (ctx.organizationId && targetUser.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Nutzer gehört zu einer anderen Organisation.' }, { status: 403 })
    }

    const body = await request.json()
    const locationIds = Array.isArray(body.locationIds) ? body.locationIds.filter((id: unknown) => typeof id === 'string') as string[] : []

    if (targetUser.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'CUSTOMER benötigen keine Standort-Zuordnung.' },
        { status: 400 }
      )
    }

    const allowedIds = ctx.allowedLocationIds
    if (allowedIds !== null) {
      const invalid = locationIds.filter((id) => !allowedIds.includes(id))
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: 'Eine oder mehrere Standorte sind nicht berechtigt.' },
          { status: 403 }
        )
      }
    } else {
      const locations = await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, organizationId: true },
      })
      if (ctx.organizationId) {
        const invalid = locations.filter((loc) => loc.organizationId !== ctx.organizationId)
        if (invalid.length > 0) {
          return NextResponse.json(
            { error: 'Eine oder mehrere Standorte gehören zu einer anderen Organisation.' },
            { status: 403 }
          )
        }
      }
    }

    await prisma.$transaction([
      prisma.userLocation.deleteMany({ where: { userId } }),
      ...(locationIds.length > 0
        ? [prisma.userLocation.createMany({ data: locationIds.map((locationId) => ({ userId, locationId })) })]
        : []),
    ])

    const updated = await prisma.userLocation.findMany({
      where: { userId },
      select: { locationId: true, location: { select: { id: true, name: true } } },
    })

    return NextResponse.json(updated.map((ul) => ({ id: ul.location.id, name: ul.location.name })))
  } catch (error) {
    console.error('Fehler beim Setzen der User-Locations:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
