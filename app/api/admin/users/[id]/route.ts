import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const userRoleEnum = z.enum(['CUSTOMER', 'KITCHEN_STAFF', 'ADMIN', 'SUPER_ADMIN'])

const updateUserSchema = z.object({
  name: z.string().min(0).optional(),
  role: userRoleEnum.optional(),
  organizationId: z.string().optional().nullable(),
})

// GET: Einzelnen Nutzer abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
        companyEmployees: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        locations: {
          select: { locationId: true, location: { select: { id: true, name: true } } },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nutzer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Fehler beim Abrufen des Nutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Nutzer aktualisieren (Rolle, Name, Organization)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const validated = updateUserSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Nutzer nicht gefunden' },
        { status: 404 }
      )
    }

    if (validated.organizationId !== undefined && validated.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: validated.organizationId },
      })
      if (!org) {
        return NextResponse.json(
          { error: 'Organisation nicht gefunden' },
          { status: 404 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.role !== undefined) updateData.role = validated.role
    if (validated.organizationId !== undefined)
      updateData.organizationId = validated.organizationId ?? null

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
        companyEmployees: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Nutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
