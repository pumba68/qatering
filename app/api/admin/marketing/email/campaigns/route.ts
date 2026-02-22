export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET /api/admin/marketing/email/campaigns — alle Kampagnen der Organisation */
export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { id: true, name: true } },
        segment: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('GET /api/admin/marketing/email/campaigns error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
