import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Bestellung per QR-Code abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { pickupCode: params.code },
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
        { error: 'Ungültiger QR-Code' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellung per QR-Code:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
