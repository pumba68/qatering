import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refund } from '@/lib/wallet'

// GET: Einzelne Bestellung abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
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
        employerCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    const walletTx = await prisma.walletTransaction.findFirst({
      where: { orderId: params.orderId, type: 'ORDER_PAYMENT' },
      orderBy: { createdAt: 'desc' },
    })
    const walletBalanceAfter = walletTx ? Number(walletTx.balanceAfter) : null

    const out = { ...order, walletBalanceAfter }
    return NextResponse.json(out)
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Bestellstatus aktualisieren (für Küchen-Dashboard)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json()
    const { status, paymentStatus } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date()
    }

    // Bei Stornierung (CANCELLED): Guthaben an den Besteller zurückerstatten
    if (status === 'CANCELLED') {
      const existingOrder = await prisma.order.findUnique({
        where: { id: params.orderId },
        select: { userId: true, pickupCode: true, paymentStatus: true },
      })
      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Bestellung nicht gefunden' },
          { status: 404 }
        )
      }
      // Nur erstatten, wenn noch nicht zurückerstattet
      if (existingOrder.paymentStatus !== 'REFUNDED') {
        const paymentTx = await prisma.walletTransaction.findFirst({
          where: {
            orderId: params.orderId,
            type: 'ORDER_PAYMENT',
          },
          orderBy: { createdAt: 'desc' },
        })
        if (paymentTx && Number(paymentTx.amount) < 0) {
          const refundAmount = Math.abs(Number(paymentTx.amount))
          await refund(existingOrder.userId, refundAmount, {
            orderId: params.orderId,
            description: `Stornierung Bestellung #${existingOrder.pickupCode}`,
          })
          updateData.paymentStatus = 'REFUNDED'
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: updateData,
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
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Bestellung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
