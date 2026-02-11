import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  type RulesCombination,
} from '@/lib/segment-audience'

const sendEmailSchema = z.object({
  segmentId: z.string().min(1, 'Segment ist erforderlich'),
  subject: z.string().min(1, 'Betreff ist erforderlich').max(500),
  body: z.string().min(1, 'Inhalt ist erforderlich').max(50000),
})

/**
 * POST: E-Mail an Segment senden (Stub).
 * Berechnet Zielgruppe, filtert nach marketingEmailConsent, gibt Empfängeranzahl zurück.
 * Kein echter Versand im MVP – nur Stub/Queue-Vorbereitung.
 */
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
    const validated = sendEmailSchema.parse(body)

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

    const audienceData = await loadAudienceData(
      ctx.organizationId,
      ctx.allowedLocationIds
    )
    const rules = (segment.rules as unknown[]) ?? []
    const combination = (segment.rulesCombination as RulesCombination) ?? 'AND'
    const userIds = computeSegmentAudienceIds(audienceData, rules, combination)

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'Keine Empfänger im Segment. Segment-Regeln anpassen oder später erneut versuchen.' },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        marketingEmailConsent: true,
      },
      select: { id: true, email: true },
    })
    const usersWithConsent = users.filter((u): u is typeof u & { email: string } => u.email != null)

    const recipientCount = usersWithConsent.length
    if (recipientCount === 0) {
      return NextResponse.json(
        {
          message: 'Keine Empfänger mit Marketing-Einwilligung im Segment.',
          segmentSize: userIds.length,
          recipientCount: 0,
        },
        { status: 200 }
      )
    }

    // Stub: Kein echter E-Mail-Versand. Später: Queue (z. B. SendGrid/Resend) anbinden.
    return NextResponse.json({
      message: 'E-Mail-Kampagne wurde zur Auslieferung vorgemerkt (Stub – kein Versand).',
      segmentSize: userIds.length,
      recipientCount,
      subject: validated.subject,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim E-Mail-Kampagnen-Stub:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
