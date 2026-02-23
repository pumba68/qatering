export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { sendEmail } from '@/lib/email-service'
import { z } from 'zod'
import crypto from 'crypto'

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Ungültige E-Mail-Adresse').trim(),
})

/**
 * POST /api/profil/email-aendern
 * Request email change. Sends confirmation link to new email address.
 */
export async function POST(request: NextRequest) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const body = await request.json()
    const { newEmail } = requestEmailChangeSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isAnonymous: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Same email check
    if (user.email === newEmail) {
      return NextResponse.json(
        { error: 'Neue E-Mail ist identisch mit aktueller E-Mail' },
        { status: 400 }
      )
    }

    // Check email not already in use
    const existingUser = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: userId } },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet' },
        { status: 409 }
      )
    }

    // Rate limit: max 3 requests per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentTokenCount = await (prisma as any).emailChangeToken.count({
      where: { userId, createdAt: { gt: tenMinutesAgo } },
    })

    if (recentTokenCount >= 3) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie 10 Minuten.' },
        { status: 429 }
      )
    }

    // Delete old pending tokens
    await (prisma as any).emailChangeToken.deleteMany({ where: { userId } })

    // Create new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await (prisma as any).emailChangeToken.create({
      data: { userId, newEmail, token, expiresAt },
    })

    // Send confirmation email to new address
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const confirmationLink = `${appUrl}/profil/email-bestaetigen?token=${token}`

    await sendEmail({
      to: newEmail,
      subject: 'E-Mail-Adresse bestätigen',
      html: `
        <h1>E-Mail-Adresse bestätigen</h1>
        <p>Bitte bestätigen Sie Ihre neue E-Mail-Adresse durch einen Klick auf den folgenden Link:</p>
        <p><a href="${confirmationLink}">${confirmationLink}</a></p>
        <p>Dieser Link ist 24 Stunden gültig.</p>
        <p>Falls Sie diese Änderung nicht angefordert haben, ignorieren Sie bitte diese E-Mail.</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler bei E-Mail-Änderungsanfrage:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/**
 * DELETE /api/profil/email-aendern
 * Cancel pending email change request
 */
export async function DELETE() {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const deleted = await (prisma as any).emailChangeToken.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true, deleted: deleted.count })
  } catch (error) {
    console.error('Fehler beim Abbrechen der E-Mail-Änderung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
