import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function requireAdminRole() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      ),
      user: null,
    }
  }

  const userRole = (session.user as { role?: string }).role
  const allowedRoles = ['ADMIN', 'KITCHEN_STAFF', 'SUPER_ADMIN']

  if (!allowedRoles.includes(userRole ?? '')) {
    return {
      error: NextResponse.json(
        { error: 'Keine Berechtigung - Admin-Rolle erforderlich' },
        { status: 403 }
      ),
      user: null,
    }
  }

  return {
    error: null,
    user: session.user,
  }
}

/** Admin-User aus DB inkl. Organisation und erlaubte Location-IDs (für Multi-Location). */
export async function getAdminContext() {
  const auth = await requireAdminRole()
  if (auth.error || !auth.user) return { error: auth.error, user: null, organizationId: null as string | null, allowedLocationIds: null as string[] | null }

  const userId = (auth.user as { id?: string }).id
  if (!userId) return { error: NextResponse.json({ error: 'Session ungültig' }, { status: 401 }), user: null, organizationId: null, allowedLocationIds: null }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      organizationId: true,
      locations: { select: { locationId: true } },
    },
  })

  if (!user) return { error: NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 }), user: null, organizationId: null, allowedLocationIds: null }

  const role = user.role as string
  const organizationId = user.organizationId

  let allowedLocationIds: string[] | null = null
  if (role === 'SUPER_ADMIN') {
    allowedLocationIds = null
  } else {
    const ids = user.locations.map((l) => l.locationId)
    allowedLocationIds = ids.length > 0 ? ids : null
  }

  return {
    error: null,
    user: auth.user,
    organizationId,
    allowedLocationIds,
  }
}
