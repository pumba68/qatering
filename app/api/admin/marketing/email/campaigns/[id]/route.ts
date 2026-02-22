export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET /api/admin/marketing/email/campaigns/[id] — Kampagnen-Detail mit Logs */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
    }

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      include: {
        template: { select: { id: true, name: true } },
        segment: { select: { id: true, name: true } },
        logs: {
          select: {
            id: true,
            email: true,
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            errorMessage: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('GET /api/admin/marketing/email/campaigns/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

/** DELETE /api/admin/marketing/email/campaigns/[id] — Geplante Kampagne stornieren */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
    }

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
    }
    if (campaign.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Nur geplante Kampagnen können storniert werden.' }, { status: 400 })
    }

    await prisma.emailCampaign.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/marketing/email/campaigns/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
