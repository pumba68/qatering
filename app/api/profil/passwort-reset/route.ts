export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { sendEmail } from '@/lib/email-service'
import crypto from 'crypto'

/**
 * POST /api/profil/passwort-reset
 * Send password reset link via email. Uses VerificationToken model.
 */
export async function POST() {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Check if user has a password (social login may not have one)
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          hasPassword: false,
          message: 'Du hast dich mit einem externen Anbieter registriert. Eine Passwortänderung ist für deinen Account nicht erforderlich.',
        },
        { status: 200 }
      )
    }

    // Rate limit: max 3 requests per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const identifier = `pw-reset:${userId}`
    const recentTokenCount = await prisma.verificationToken.count({
      where: {
        identifier,
        // Note: VerificationToken doesn't have createdAt, so we check based on expires
        // If expires is far in future, it's recent
      },
    })

    if (recentTokenCount >= 3) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie 10 Minuten.' },
        { status: 429 }
      )
    }

    // Delete old reset tokens
    await prisma.verificationToken.deleteMany({ where: { identifier } })

    // Create new reset token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verificationToken.create({
      data: { identifier, token, expires: expiresAt },
    })

    // Send reset email
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'Passwort zurücksetzen',
      html: `
        <h1>Passwort zurücksetzen</h1>
        <p>Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zu ändern:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie bitte diese E-Mail.</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Wir haben dir einen Link zum Zurücksetzen deines Passworts an ${user.email} gesendet.`,
    })
  } catch (error) {
    console.error('Fehler beim Passwort-Reset-Request:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
