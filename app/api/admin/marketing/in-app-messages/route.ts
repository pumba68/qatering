import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const inAppMessageSchema = z.object({
  segmentId: z.string().min(1, 'Segment ist erforderlich'),
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(1, 'Inhalt ist erforderlich'),
  linkUrl: z.string().url().optional().nullable().or(z.literal('')),
  displayPlace: z.enum(['menu', 'wallet', 'dashboard']).default('menu'),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

/** GET: Alle In-App-Nachrichten der Organisation */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get('segmentId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: { organizationId: string; segmentId?: string; isActive?: boolean } = {
      organizationId: ctx.organizationId,
    }
    if (segmentId) where.segmentId = segmentId
    if (!includeInactive) where.isActive = true

    const messages = await prisma.inAppMessage.findMany({
      where,
      orderBy: [{ startDate: 'desc' }],
      include: {
        segment: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Fehler beim Abrufen der In-App-Nachrichten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/** POST: Neue In-App-Nachricht anlegen */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = inAppMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.errors },
        { status: 400 }
      )
    }
    const validated = parsed.data

    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: validated.segmentId,
        organizationId: ctx.organizationId,
      },
    })
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment nicht gefunden' },
        { status: 404 }
      )
    }

    const message = await prisma.inAppMessage.create({
      data: {
        organizationId: ctx.organizationId,
        segmentId: validated.segmentId,
        title: validated.title ?? null,
        body: validated.body,
        linkUrl: validated.linkUrl && validated.linkUrl !== '' ? validated.linkUrl : null,
        displayPlace: validated.displayPlace,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        isActive: validated.isActive ?? true,
      },
      include: {
        segment: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen der In-App-Nachricht:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
