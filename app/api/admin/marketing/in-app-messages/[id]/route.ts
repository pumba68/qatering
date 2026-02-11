import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateInAppMessageSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(1).optional(),
  linkUrl: z.string().url().optional().nullable().or(z.literal('')),
  displayPlace: z.enum(['menu', 'wallet', 'dashboard']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

/** GET: Einzelne In-App-Nachricht */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const message = await prisma.inAppMessage.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { segment: { select: { id: true, name: true } } },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'In-App-Nachricht nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Fehler beim Abrufen der In-App-Nachricht:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** PATCH: In-App-Nachricht aktualisieren */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await prisma.inAppMessage.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'In-App-Nachricht nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateInAppMessageSchema.parse(body)

    const updateData: {
      title?: string | null
      body?: string
      linkUrl?: string | null
      displayPlace?: string
      startDate?: Date
      endDate?: Date | null
      isActive?: boolean
    } = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.body !== undefined) updateData.body = validated.body
    if (validated.linkUrl !== undefined) updateData.linkUrl = validated.linkUrl === '' ? null : validated.linkUrl
    if (validated.displayPlace !== undefined) updateData.displayPlace = validated.displayPlace
    if (validated.startDate !== undefined) updateData.startDate = new Date(validated.startDate)
    if (validated.endDate !== undefined) updateData.endDate = validated.endDate ? new Date(validated.endDate) : null
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const message = await prisma.inAppMessage.update({
      where: { id },
      data: updateData,
      include: { segment: { select: { id: true, name: true } } },
    })

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren der In-App-Nachricht:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** DELETE: In-App-Nachricht löschen */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await prisma.inAppMessage.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'In-App-Nachricht nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.inAppMessage.delete({ where: { id } })
    return NextResponse.json({ message: 'In-App-Nachricht gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der In-App-Nachricht:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
