export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  type RulesCombination,
} from '@/lib/segment-audience'
import { sendEmail, getEmailFrom, getDefaultSenderName } from '@/lib/email-service'
import { renderTemplateToHtml } from '@/lib/template-renderer'
import { wrapEmailHtml, rewriteLinksForTracking } from '@/lib/email-html-wrapper'
import type { TemplateContent } from '@/components/marketing/editor/editor-types'

const createCampaignSchema = z.object({
  templateId: z.string().min(1),
  segmentId: z.string().min(1).optional().nullable(),
  subjectLine: z.string().min(1, 'Betreff ist erforderlich').max(80),
  preheaderText: z.string().max(150).optional().nullable(),
  senderName: z.string().max(100).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

/**
 * POST /api/admin/marketing/email
 * Erstellt eine EmailCampaign und versendet sie (sofort oder geplant).
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.errors }, { status: 400 })
    }

    const { templateId, segmentId, subjectLine, preheaderText, senderName, scheduledAt } = parsed.data
    const userId = (ctx.user as { id?: string }).id

    // Template laden
    const template = await prisma.marketingTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ organizationId: ctx.organizationId }, { isStarter: true }],
      },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    // Zielgruppe ermitteln
    let recipientUsers: { id: string; email: string; name: string | null }[] = []
    if (segmentId) {
      const segment = await prisma.customerSegment.findFirst({
        where: { id: segmentId, organizationId: ctx.organizationId },
      })
      if (!segment) {
        return NextResponse.json({ error: 'Segment nicht gefunden' }, { status: 404 })
      }
      const audienceData = await loadAudienceData(ctx.organizationId, ctx.allowedLocationIds)
      const rules = (segment.rules as unknown[]) ?? []
      const combination = (segment.rulesCombination as RulesCombination) ?? 'AND'
      const userIds = computeSegmentAudienceIds(audienceData, rules, combination)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, marketingEmailConsent: true },
        select: { id: true, email: true, name: true },
      })
      recipientUsers = users.filter((u): u is typeof u & { email: string } => u.email != null)
    } else {
      // Alle Kunden der Organisation mit Einwilligung
      const users = await prisma.user.findMany({
        where: { organizationId: ctx.organizationId, marketingEmailConsent: true },
        select: { id: true, email: true, name: true },
      })
      recipientUsers = users.filter((u): u is typeof u & { email: string } => u.email != null)
    }

    const totalRecipients = recipientUsers.length

    // Kampagne anlegen
    const campaign = await prisma.emailCampaign.create({
      data: {
        organizationId: ctx.organizationId,
        templateId,
        templateSnapshot: template.content as object,
        subjectLine,
        preheaderText: preheaderText ?? null,
        senderName: senderName ?? null,
        segmentId: segmentId ?? null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'SENDING',
        totalRecipients,
        createdById: userId ?? null,
      },
    })

    // Wenn geplant → direkt zurückgeben
    if (scheduledAt) {
      return NextResponse.json({
        id: campaign.id,
        status: 'SCHEDULED',
        totalRecipients,
        scheduledAt,
      })
    }

    // Sofortversand: Log-Einträge anlegen und Mails versenden
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://localhost:3000'
    const fromName = senderName ?? getDefaultSenderName()
    const fromEmail = getEmailFrom()
    const from = `${fromName} <${fromEmail}>`

    // Template-HTML rendern
    const templateContent = template.content as Partial<TemplateContent>
    const contentObj: TemplateContent = {
      globalStyle: (templateContent.globalStyle as TemplateContent['globalStyle']) ?? {
        bgColor: '#ffffff', fontFamily: '', padding: 24,
      },
      blocks: Array.isArray(templateContent.blocks) ? templateContent.blocks : [],
    }

    let sentCount = 0
    let failedCount = 0

    for (const user of recipientUsers) {
      // Log-Eintrag erstellen (PENDING)
      const log = await prisma.emailCampaignLog.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          email: user.email,
          status: 'PENDING',
        },
      })

      // Platzhalter befüllen
      const variables: Record<string, string> = {
        '{{Vorname}}': user.name?.split(' ')[0] ?? '',
        '{{Name}}': user.name ?? '',
        '{{Email}}': user.email,
      }

      // HTML erzeugen
      const bodyHtml = renderTemplateToHtml(contentObj, variables)
      const htmlWithTracking = rewriteLinksForTracking(bodyHtml, log.trackingToken, baseUrl)
      const fullHtml = wrapEmailHtml({
        bodyHtml: htmlWithTracking,
        preheaderText: preheaderText ?? undefined,
        trackingToken: log.trackingToken,
        baseUrl,
        subject: subjectLine,
      })

      // Mail senden
      const result = await sendEmail({
        to: user.email,
        subject: subjectLine,
        html: fullHtml,
        from,
      })

      if (result.success) {
        sentCount++
        await prisma.emailCampaignLog.update({
          where: { id: log.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
      } else {
        failedCount++
        await prisma.emailCampaignLog.update({
          where: { id: log.id },
          data: { status: 'FAILED', errorMessage: result.error },
        })
      }
    }

    // Kampagne als SENT markieren
    const finalStatus = failedCount === totalRecipients && totalRecipients > 0 ? 'FAILED' : 'SENT'
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    })

    return NextResponse.json({
      id: campaign.id,
      status: finalStatus,
      totalRecipients,
      sentCount,
      failedCount,
    })
  } catch (error) {
    console.error('POST /api/admin/marketing/email error:', error)
    const message = error instanceof Error ? error.message : 'Interner Serverfehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
