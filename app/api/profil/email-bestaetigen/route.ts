export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/profil/email-bestaetigen?token=xxx
 * Validate token, switch user email, delete token. No auth required — token is proof.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token erforderlich' }, { status: 400 })
  }

  try {
    const emailToken = await (prisma as any).emailChangeToken.findUnique({
      where: { token },
      select: { id: true, userId: true, newEmail: true, expiresAt: true },
    })

    if (!emailToken) {
      return NextResponse.json(
        { error: 'Token nicht gefunden oder bereits verwendet' },
        { status: 404 }
      )
    }

    if (emailToken.expiresAt < new Date()) {
      // Clean up expired token
      await (prisma as any).emailChangeToken.delete({ where: { token } })
      return NextResponse.json({ error: 'Token ist abgelaufen' }, { status: 410 })
    }

    // Check email still available (race condition guard)
    const conflictingUser = await prisma.user.findFirst({
      where: { email: emailToken.newEmail, NOT: { id: emailToken.userId } },
      select: { id: true },
    })

    if (conflictingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet' },
        { status: 409 }
      )
    }

    // Update user and delete token in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailToken.userId },
        data: { email: emailToken.newEmail },
      }),
      (prisma as any).emailChangeToken.delete({ where: { token } }),
    ])

    return NextResponse.json({ success: true, newEmail: emailToken.newEmail })
  } catch (error) {
    console.error('Fehler bei E-Mail-Bestätigung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
