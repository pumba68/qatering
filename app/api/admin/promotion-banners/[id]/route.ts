import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  couponId: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
})

// GET: Einzelnes Promotion-Banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const banner = await prisma.promotionBanner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: 'Promotion-Banner nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Fehler beim Abrufen des Promotion-Banners:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Promotion-Banner aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const data: { title?: string; subtitle?: string | null; imageUrl?: string | null; couponId?: string | null; isActive?: boolean } = {}
    if (validated.title !== undefined) data.title = validated.title
    if (validated.subtitle !== undefined) data.subtitle = validated.subtitle
    if (validated.imageUrl !== undefined) data.imageUrl = validated.imageUrl === '' ? null : validated.imageUrl
    if (validated.couponId !== undefined) data.couponId = validated.couponId === '' ? null : validated.couponId
    if (validated.isActive !== undefined) data.isActive = validated.isActive

    const banner = await prisma.promotionBanner.update({
      where: { id },
      data,
    })

    return NextResponse.json(banner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Promotion-Banners:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Promotion-Banner löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params

    await prisma.promotionBanner.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Fehler beim Löschen des Promotion-Banners:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
