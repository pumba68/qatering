export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  marketingEmailConsent: z.boolean(),
})

/**
 * PATCH /api/profil/einstellungen
 * Update user settings (marketing consent toggle)
 */
export async function PATCH(request: NextRequest) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const body = await request.json()
    const { marketingEmailConsent } = updateSettingsSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { marketingEmailConsent },
      select: { id: true, marketingEmailConsent: true },
    })

    return NextResponse.json({
      success: true,
      marketingEmailConsent: updated.marketingEmailConsent,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler bei Einstellungs-Update:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
