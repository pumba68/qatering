export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token erforderlich'),
  newPassword: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Passwort zu lang'),
})

/**
 * POST /api/auth/reset-password
 * Validate reset token + update password. No auth required — token is proof.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = resetPasswordSchema.parse(body)

    // Find reset token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: 'pw-reset:' },
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token nicht gefunden oder bereits verwendet' },
        { status: 404 }
      )
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier, token },
      })
      return NextResponse.json(
        {
          error: 'Dieser Link ist abgelaufen. Bitte beantrage einen neuen Passwort-Reset.',
        },
        { status: 410 }
      )
    }

    // Extract userId from identifier
    const userId = verificationToken.identifier.replace('pw-reset:', '')

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password and delete token in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier, token },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler beim Passwort-Reset:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
