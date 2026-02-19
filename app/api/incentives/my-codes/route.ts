/**
 * GET: Incentive-Codes des eingeloggten Users (personalisierte Coupons, noch nicht eingelöst).
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json({ error: 'Session ungültig' }, { status: 401 })
    }

    const grants = await prisma.incentiveGrant.findMany({
      where: {
        userId,
        redeemedAt: null,
        segmentIncentive: { isActive: true },
        couponCode: { not: null },
      },
      include: {
        segmentIncentive: {
          select: {
            name: true,
            coupon: { select: { name: true, discountValue: true, type: true } },
          },
        },
      },
    })

    const now = new Date()
    const valid = grants
      .filter((g) => {
        const inc = g.segmentIncentive
        if (inc.endDate && new Date(inc.endDate) < now) return false
        return true
      })
      .map((g) => ({
        id: g.id,
        code: g.couponCode,
        name: g.segmentIncentive.name || g.segmentIncentive.coupon?.name,
        type: g.segmentIncentive.coupon?.type,
        discountValue: g.segmentIncentive.coupon?.discountValue != null
          ? Number(g.segmentIncentive.coupon.discountValue)
          : undefined,
      }))

    return NextResponse.json(valid)
  } catch (error) {
    console.error('Fehler beim Abrufen der Incentive-Codes:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
