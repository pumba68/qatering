export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

type SessionUser = { id?: string }

/** POST: Browser-Push-Subscription speichern */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as SessionUser | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Subscription', details: parsed.error.errors }, { status: 400 })
    }

    const { endpoint, keys } = parsed.data

    // Upsert: same user + endpoint → update keys
    await prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint } },
      create: {
        userId,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
      },
      update: {
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Speichern der Push-Subscription:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/** DELETE: Push-Subscription entfernen */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as SessionUser | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { endpoint } = await request.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint fehlt' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen der Push-Subscription:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
