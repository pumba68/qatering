import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import type { Prisma } from '@/src/generated/prisma'
import { renderTemplateToHtml } from '@/lib/template-renderer'
import type { TemplateContent } from '@/components/marketing/editor/editor-types'

const pushSchema = z.object({
  templateId: z.string().min(1, 'Template ist erforderlich'),
  segmentId: z.string().min(1, 'Segment ist erforderlich'),
  pushTitle: z.string().max(65, 'Titel max. 65 Zeichen'),
  pushBody: z.string().max(200, 'Body max. 200 Zeichen'),
  deepLink: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
})

/** GET: Alle Push-Kampagnen der Organisation */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Prisma.PushNotificationWhereInput = { organizationId: ctx.organizationId }
    if (status) where.status = status as 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED'

    const campaigns = await prisma.pushNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        segment: { select: { id: true, name: true } },
        marketingTemplate: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Fehler beim Abrufen der Push-Kampagnen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/** POST: Neue Push-Kampagne anlegen (Status DRAFT oder SCHEDULED) */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = pushSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.errors }, { status: 400 })
    }
    const validated = parsed.data

    // Verify template belongs to org
    const template = await prisma.marketingTemplate.findFirst({
      where: { id: validated.templateId, organizationId: ctx.organizationId },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    // Verify segment belongs to org
    const segment = await prisma.customerSegment.findFirst({
      where: { id: validated.segmentId, organizationId: ctx.organizationId },
    })
    if (!segment) {
      return NextResponse.json({ error: 'Segment nicht gefunden' }, { status: 404 })
    }

    // Create content snapshot
    const content = template.content as unknown as TemplateContent
    const html = renderTemplateToHtml(content, {})
    const templateSnapshot: Prisma.InputJsonValue = { html, raw: template.content }

    const scheduledAt = validated.scheduledAt ? new Date(validated.scheduledAt) : null
    const status = scheduledAt ? 'SCHEDULED' : 'DRAFT'

    const campaign = await prisma.pushNotification.create({
      data: {
        organizationId: ctx.organizationId,
        marketingTemplateId: validated.templateId,
        templateSnapshot,
        segmentId: validated.segmentId,
        pushTitle: validated.pushTitle,
        pushBody: validated.pushBody,
        deepLink: validated.deepLink ?? null,
        status,
        scheduledAt,
      },
      include: {
        segment: { select: { id: true, name: true } },
        marketingTemplate: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen der Push-Kampagne:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
