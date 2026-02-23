export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { z } from 'zod'

const deleteAccountSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').trim(),
})

/**
 * POST /api/profil/konto-loeschen
 * Anonymize user account (soft-delete). DSGVO-compliant.
 */
export async function POST(request: NextRequest) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const body = await request.json()
    const { email } = deleteAccountSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Verify email matches
    if (user.email !== email.trim()) {
      return NextResponse.json(
        { error: 'Die eingegebene E-Mail stimmt nicht überein' },
        { status: 400 }
      )
    }

    // Check for active orders
    const activeOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      select: { id: true },
    })

    if (activeOrder) {
      return NextResponse.json(
        {
          error: 'active_order',
          message:
            'Du hast noch eine laufende Bestellung. Dein Konto wird erst nach Abschluss dieser Bestellung anonymisiert.',
          orderId: activeOrder.id,
        },
        { status: 409 }
      )
    }

    // Anonymize in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: `deleted-${userId}@anonymized.local`,
          image: null,
          passwordHash: null,
          marketingEmailConsent: false,
        },
      }),
      prisma.customerPreference.deleteMany({ where: { userId } }),
      prisma.pushSubscription.deleteMany({ where: { userId } }),
      (prisma as any).emailChangeToken.deleteMany({ where: { userId } }),
      prisma.verificationToken.deleteMany({
        where: { identifier: { startsWith: `pw-reset:${userId}` } },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Dein Konto wurde anonymisiert. Deine Bestellhistorie bleibt erhalten.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler bei Konto-Löschung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
