import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { NextResponse } from 'next/server'

export async function getCustomerContext() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 }),
      userId: null as null,
    }
  }

  const userId = (session.user as { id: string }).id
  const role = (session.user as { role: string }).role

  if (role !== 'CUSTOMER') {
    return {
      error: NextResponse.json({ error: 'Kein Kundenzugang' }, { status: 403 }),
      userId: null as null,
    }
  }

  return { error: null, userId }
}
