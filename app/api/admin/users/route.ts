import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

// GET: Alle Nutzer abrufen (für Admin-Verwaltung und Dropdowns)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')
    const search = searchParams.get('search')?.trim() || ''
    const validRoles = ['CUSTOMER', 'KITCHEN_STAFF', 'ADMIN', 'SUPER_ADMIN'] as const
    const role: (typeof validRoles)[number] | undefined =
      roleParam && validRoles.includes(roleParam as (typeof validRoles)[number]) ? (roleParam as (typeof validRoles)[number]) : undefined

    const where: { role?: (typeof validRoles)[number]; OR?: Array<{ email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }> } = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Fehler beim Abrufen der Nutzer:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
