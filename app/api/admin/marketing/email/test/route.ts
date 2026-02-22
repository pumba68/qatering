export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import { sendEmail, getEmailFrom, getDefaultSenderName } from '@/lib/email-service'
import { renderTemplateToHtml } from '@/lib/template-renderer'
import { wrapEmailHtml } from '@/lib/email-html-wrapper'
import type { TemplateContent } from '@/components/marketing/editor/editor-types'
import { randomUUID } from 'crypto'

const testSchema = z.object({
  templateId: z.string().min(1),
  recipientEmail: z.string().email('Ungültige E-Mail-Adresse'),
  subjectLine: z.string().min(1).max(80),
  preheaderText: z.string().max(150).optional().nullable(),
  senderName: z.string().max(100).optional().nullable(),
})

/**
 * POST /api/admin/marketing/email/test
 * Sendet eine Test-Mail an die angegebene Adresse (kein DB-Log).
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = testSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.errors }, { status: 400 })
    }

    const { templateId, recipientEmail, subjectLine, preheaderText, senderName } = parsed.data

    const template = await prisma.marketingTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ organizationId: ctx.organizationId }, { isStarter: true }],
      },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://localhost:3000'
    const fromName = senderName ?? getDefaultSenderName()
    const from = `${fromName} <${getEmailFrom()}>`
    const testToken = randomUUID()

    const templateContent = template.content as Partial<TemplateContent>
    const contentObj: TemplateContent = {
      globalStyle: (templateContent.globalStyle as TemplateContent['globalStyle']) ?? {
        bgColor: '#ffffff', fontFamily: '', padding: 24,
      },
      blocks: Array.isArray(templateContent.blocks) ? templateContent.blocks : [],
    }

    const variables: Record<string, string> = {
      '{{Vorname}}': 'Max',
      '{{Name}}': 'Max Mustermann',
      '{{Email}}': recipientEmail,
    }

    const bodyHtml = renderTemplateToHtml(contentObj, variables)

    // Test-Banner oben einfügen
    const testBanner = `<div style="background:#fef3c7;border:2px solid #f59e0b;padding:12px 16px;text-align:center;font-family:system-ui,sans-serif;font-size:14px;color:#92400e;font-weight:600;">
      [TEST] Diese E-Mail ist ein Testversand und wurde nicht an echte Empfänger versendet.
    </div>`

    const fullHtml = wrapEmailHtml({
      bodyHtml: testBanner + bodyHtml,
      preheaderText: preheaderText ?? undefined,
      trackingToken: testToken,
      baseUrl,
      subject: `[TEST] ${subjectLine}`,
    })

    const result = await sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${subjectLine}`,
      html: fullHtml,
      from,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Versand fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true, to: recipientEmail })
  } catch (error) {
    console.error('POST /api/admin/marketing/email/test error:', error)
    const message = error instanceof Error ? error.message : 'Interner Serverfehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
