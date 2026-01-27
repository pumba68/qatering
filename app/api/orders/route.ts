import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { generatePickupCode } from '@/lib/utils'

// POST: Neue Bestellung erstellen
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
    const { locationId, items, pickupDate, notes, couponCode } = body
    const userId = (session.user as any).id

    if (!locationId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Ungültige Bestelldaten' },
        { status: 400 }
      )
    }

    // MenuItems validieren und Preise berechnen
    let totalAmount = 0
    const menuItems: Array<{ menuItem: any, quantity: number }> = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { dish: true },
      })

      if (!menuItem || !menuItem.available) {
        return NextResponse.json(
          { error: `Gericht "${menuItem?.dish.name || 'Unbekannt'}" nicht verfügbar` },
          { status: 400 }
        )
      }

      // Prüfen ob maxOrders erreicht
      if (menuItem.maxOrders && menuItem.currentOrders >= menuItem.maxOrders) {
        return NextResponse.json(
          { error: `Gericht "${menuItem.dish.name}" ist ausverkauft` },
          { status: 400 }
        )
      }

      totalAmount += Number(menuItem.price) * item.quantity
      menuItems.push({ menuItem, quantity: item.quantity })
    }

    // Coupon validieren und anwenden (falls vorhanden)
    let coupon = null
    let discountAmount = 0
    let finalAmount = totalAmount
    let freeItemToAdd: { menuItemId: string; quantity: number } | null = null

    if (couponCode) {
      const couponResult = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
        include: { freeItemDish: true },
      })

      if (couponResult && couponResult.isActive) {
        // Validiere Coupon erneut
        const now = new Date()
        const isValidLocation = !couponResult.locationId || couponResult.locationId === locationId
        const isValidTime = (!couponResult.startDate || new Date(couponResult.startDate) <= now) &&
                           (!couponResult.endDate || new Date(couponResult.endDate) >= now)
        const isValidMinOrder = !couponResult.minOrderAmount || totalAmount >= Number(couponResult.minOrderAmount)
        const isValidMaxUses = !couponResult.maxUses || couponResult.currentUses < couponResult.maxUses
        const isValidUserUses = !couponResult.maxUsesPerUser || 
          (await prisma.couponRedemption.count({
            where: { couponId: couponResult.id, userId },
          })) < couponResult.maxUsesPerUser

        if (isValidLocation && isValidTime && isValidMinOrder && isValidMaxUses && isValidUserUses) {
          coupon = couponResult

          // Berechne Rabatt
          if (coupon.type === 'DISCOUNT_PERCENTAGE') {
            discountAmount = (totalAmount * Number(coupon.discountValue)) / 100
            finalAmount = totalAmount - discountAmount
          } else if (coupon.type === 'DISCOUNT_FIXED') {
            discountAmount = Number(coupon.discountValue)
            finalAmount = Math.max(0, totalAmount - discountAmount)
          } else if (coupon.type === 'FREE_ITEM' && coupon.freeItemDish) {
            // Suche nach MenuItem für das kostenlose Gericht
            // Für jetzt nehmen wir an, dass es für denselben Tag wie die Bestellung ist
            const pickupDateObj = new Date(pickupDate)
            const dayStart = new Date(pickupDateObj)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(pickupDateObj)
            dayEnd.setHours(23, 59, 59, 999)

            const menu = await prisma.menu.findFirst({
              where: {
                locationId,
                startDate: { lte: pickupDateObj },
                endDate: { gte: pickupDateObj },
                isPublished: true,
              },
              include: {
                menuItems: {
                  where: {
                    dishId: coupon.freeItemDish.id,
                    date: {
                      gte: dayStart,
                      lt: dayEnd,
                    },
                    available: true,
                  },
                  take: 1,
                },
              },
            })

            if (menu && menu.menuItems.length > 0) {
              freeItemToAdd = {
                menuItemId: menu.menuItems[0].id,
                quantity: 1,
              }
              // Für kostenlose Artikel wird kein Rabatt abgezogen, sondern das Item kostenlos hinzugefügt
              discountAmount = Number(menu.menuItems[0].price)
              finalAmount = totalAmount // Endbetrag bleibt gleich, da Extra kostenlos ist
            }
          }
        }
      }
    }

    // QR-Code generieren (eindeutig)
    let pickupCode: string = ''
    let codeExists = true
    while (codeExists) {
      pickupCode = generatePickupCode()
      const existingOrder = await prisma.order.findUnique({
        where: { pickupCode },
      })
      codeExists = !!existingOrder
    }

    // Bestellung erstellen (Transaction)
    const order = await prisma.$transaction(async (tx) => {
      // Füge kostenloses Item hinzu, falls vorhanden
      const allMenuItems = [...menuItems]
      if (freeItemToAdd) {
        const freeMenuItem = await tx.menuItem.findUnique({
          where: { id: freeItemToAdd.menuItemId },
          include: { dish: true },
        })
        if (freeMenuItem) {
          allMenuItems.push({ menuItem: freeMenuItem, quantity: freeItemToAdd.quantity })
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          locationId,
          totalAmount,
          finalAmount: finalAmount !== totalAmount ? finalAmount : null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          couponCode: coupon?.code || null,
          pickupCode: pickupCode,
          pickupDate: new Date(pickupDate),
          notes,
          status: 'PENDING',
          paymentStatus: 'PENDING', // In Phase 1 erstmal PENDING, später mit Stripe/PayPal
          items: {
            create: allMenuItems.map(({ menuItem, quantity }) => ({
              menuItemId: menuItem.id,
              quantity,
              price: freeItemToAdd && menuItem.id === freeItemToAdd.menuItemId ? 0 : menuItem.price, // Kostenloses Item hat Preis 0
            })),
          },
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  dish: true,
                },
              },
            },
          },
        },
      })

      // Coupon-Redemption erstellen (falls Coupon verwendet wurde)
      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId,
            orderId: newOrder.id,
          },
        })

        // currentUses im Coupon erhöhen
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            currentUses: {
              increment: 1,
            },
          },
        })
      }

      // currentOrders in MenuItems aktualisieren
      for (const { menuItem, quantity } of allMenuItems) {
        await tx.menuItem.update({
          where: { id: menuItem.id },
          data: {
            currentOrders: {
              increment: quantity,
            },
          },
        })
      }

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Bestellung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// GET: Bestellungen abrufen (mit Filtern)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const pickupDate = searchParams.get('pickupDate')

    const where: any = {}
    if (userId) where.userId = userId
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    if (pickupDate) {
      const date = new Date(pickupDate)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.pickupDate = {
        gte: date,
        lt: nextDay,
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                dish: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
