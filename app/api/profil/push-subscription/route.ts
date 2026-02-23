export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'

/**
 * DELETE /api/profil/push-subscription
 * Unsubscribe from all push notifications by deleting all push subscriptions for this user
 */
export async function DELETE() {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const result = await prisma.pushSubscription.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Fehler beim Löschen der Push-Subscriptions:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
