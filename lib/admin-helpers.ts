import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { NextResponse } from 'next/server'

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

  const userRole = (session.user as any).role
  const allowedRoles = ['ADMIN', 'KITCHEN_STAFF', 'SUPER_ADMIN']
  
  if (!allowedRoles.includes(userRole)) {
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
