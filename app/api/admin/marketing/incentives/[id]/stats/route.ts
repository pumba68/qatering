import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

// GET: Statistik zu einem Incentive (Ausspielungen, Einlösungen)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params
    const incentive = await prisma.segmentIncentive.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!incentive) {
      return NextResponse.json({ error: 'Incentive nicht gefunden.' }, { status: 404 })
    }

    const totalGrants = await prisma.incentiveGrant.count({
      where: { segmentIncentiveId: id },
    })

    let redeemedCount = 0
    if (incentive.incentiveType === 'COUPON') {
      redeemedCount = await prisma.incentiveGrant.count({
        where: {
          segmentIncentiveId: id,
          redeemedAt: { not: null },
        },
      })
      // Fallback: Zähle CouponRedemptions für personalisierte Coupons
      if (redeemedCount === 0) {
        const grantsWithCoupon = await prisma.incentiveGrant.findMany({
          where: { segmentIncentiveId: id, couponId: { not: null } },
          select: { couponId: true },
        })
        const couponIds = grantsWithCoupon.map((g) => g.couponId).filter(Boolean) as string[]
        if (couponIds.length > 0) {
          redeemedCount = await prisma.couponRedemption.count({
            where: { couponId: { in: couponIds } },
          })
        }
      }
    } else if (incentive.incentiveType === 'WALLET_CREDIT') {
      redeemedCount = totalGrants // Guthaben ist sofort „eingelöst“
    }

    return NextResponse.json({
      totalGrants,
      redeemedCount,
      pendingCount: totalGrants - redeemedCount,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Incentive-Statistik:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
