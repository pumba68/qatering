import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
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
