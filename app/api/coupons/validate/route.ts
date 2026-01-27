import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// POST: Coupon validieren und Rabatt berechnen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, locationId, totalAmount, items } = body
    const userId = (session.user as any).id

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon-Code ist erforderlich' },
        { status: 400 }
      )
    }

    // Coupon finden
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        freeItemDish: true,
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Ungültiger Coupon-Code' },
        { status: 404 }
      )
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'Dieser Coupon ist nicht mehr aktiv' },
        { status: 400 }
      )
    }

    // Prüfe Location (falls Coupon spezifisch für Location)
    if (coupon.locationId && coupon.locationId !== locationId) {
      return NextResponse.json(
        { error: 'Dieser Coupon ist nicht für diese Location gültig' },
        { status: 400 }
      )
    }

    // Prüfe Zeitraum
    const now = new Date()
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return NextResponse.json(
        { error: 'Dieser Coupon ist noch nicht aktiv' },
        { status: 400 }
      )
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return NextResponse.json(
        { error: 'Dieser Coupon ist abgelaufen' },
        { status: 400 }
      )
    }

    // Prüfe Mindestbestellwert
    if (coupon.minOrderAmount && totalAmount < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { error: `Mindestbestellwert von ${Number(coupon.minOrderAmount).toFixed(2)}€ nicht erreicht` },
        { status: 400 }
      )
    }

    // Prüfe Gesamt-Nutzungslimit
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'Dieser Coupon wurde bereits zu oft eingelöst' },
        { status: 400 }
      )
    }

    // Prüfe Nutzung pro User
    if (coupon.maxUsesPerUser) {
      const userRedemptions = await prisma.couponRedemption.count({
        where: {
          couponId: coupon.id,
          userId: userId,
        },
      })

      if (userRedemptions >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: 'Sie haben diesen Coupon bereits verwendet' },
          { status: 400 }
        )
      }
    }

    // Berechne Rabatt oder Extra
    let discountAmount = 0
    let finalAmount = totalAmount
    let freeItem = null

    if (coupon.type === 'DISCOUNT_PERCENTAGE') {
      discountAmount = (totalAmount * Number(coupon.discountValue)) / 100
      finalAmount = totalAmount - discountAmount
    } else if (coupon.type === 'DISCOUNT_FIXED') {
      discountAmount = Number(coupon.discountValue)
      finalAmount = Math.max(0, totalAmount - discountAmount) // Nicht negativ
    } else if (coupon.type === 'FREE_ITEM' && coupon.freeItemDish) {
      freeItem = {
        id: coupon.freeItemDish.id,
        name: coupon.freeItemDish.name,
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discountAmount: discountAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2),
        freeItem,
      },
    })
  } catch (error) {
    console.error('Fehler bei der Coupon-Validierung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
