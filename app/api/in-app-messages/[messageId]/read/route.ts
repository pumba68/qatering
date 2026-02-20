export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

/**
 * POST: In-App-Nachricht als gelesen markieren (für aktuellen User).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json(
        { error: 'Session ungültig' },
        { status: 401 }
      )
    }

    const { messageId } = await params
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId erforderlich' },
        { status: 400 }
      )
    }

    const message = await prisma.inAppMessage.findFirst({
      where: { id: messageId },
      select: { id: true },
    })
    if (!message) {
      return NextResponse.json(
        { error: 'Nachricht nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.inAppMessageRead.upsert({
      where: {
        messageId_userId: { messageId, userId },
      },
      create: { messageId, userId },
      update: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Fehler beim Markieren der In-App-Nachricht:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
