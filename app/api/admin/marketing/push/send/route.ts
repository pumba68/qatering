import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import webpush from 'web-push'
import { z } from 'zod'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  type RulesCombination,
} from '@/lib/segment-audience'

const sendSchema = z.object({
  campaignId: z.string().min(1),
})

// Set VAPID keys (must be configured via env)
if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

/** POST: Push-Kampagne sofort versenden */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
      return NextResponse.json(
        { error: 'VAPID-Schlüssel sind nicht konfiguriert (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.errors }, { status: 400 })
    }

    const campaign = await prisma.pushNotification.findFirst({
      where: { id: parsed.data.campaignId, organizationId: ctx.organizationId },
      include: { segment: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
    }
    if (campaign.status === 'SENT') {
      return NextResponse.json({ error: 'Kampagne wurde bereits gesendet' }, { status: 400 })
    }

    // Find all user IDs in segment using the segment-audience utility
    const segment = await prisma.customerSegment.findUnique({
      where: { id: campaign.segmentId },
      select: { rules: true, rulesCombination: true },
    })
    let userIds: string[] = []
    if (segment) {
      const audienceData = await loadAudienceData(ctx.organizationId, null)
      userIds = computeSegmentAudienceIds(
        audienceData,
        segment.rules,
        (segment.rulesCombination as RulesCombination) ?? 'AND'
      )
    }

    // Find push subscriptions for those users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    })

    const payload = JSON.stringify({
      title: campaign.pushTitle,
      body: campaign.pushBody,
      ...(campaign.deepLink ? { data: { url: campaign.deepLink } } : {}),
    })

    let sentCount = 0
    let failedCount = 0

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
            },
            payload,
          )
          await prisma.pushNotificationLog.create({
            data: {
              pushNotificationId: campaign.id,
              userId: sub.userId,
              status: 'SENT',
            },
          })
          sentCount++
        } catch (err) {
          console.error(`Push fehlgeschlagen für userId ${sub.userId}:`, err)
          await prisma.pushNotificationLog.create({
            data: {
              pushNotificationId: campaign.id,
              userId: sub.userId,
              status: 'FAILED',
            },
          })
          failedCount++
        }
      })
    )

    // Update campaign status
    const updated = await prisma.pushNotification.update({
      where: { id: campaign.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        totalRecipients: sentCount,
      },
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      noSubscriptionCount: userIds.length - subscriptions.length,
      campaign: updated,
    })
  } catch (error) {
    console.error('Fehler beim Senden der Push-Kampagne:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
