export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/email-track/click/[token]?url=... — Klick-Tracking + Redirect */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const targetUrl = request.nextUrl.searchParams.get('url') ?? '/'

  // Klick tracken (nicht kritisch)
  try {
    const log = await prisma.emailCampaignLog.findUnique({
      where: { trackingToken: params.token },
    })
    if (log) {
      await prisma.emailCampaignLog.update({
        where: { id: log.id },
        data: {
          clickedAt: log.clickedAt ?? new Date(),
          status: 'CLICKED',
        },
      })
    }
  } catch {
    // Tracking-Fehler sind nicht kritisch
  }

  // Sicherheitscheck: Nur http/https URLs weiterleiten
  let safeUrl = '/'
  try {
    const parsed = new URL(targetUrl)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      safeUrl = targetUrl
    }
  } catch {
    safeUrl = '/'
  }

  return NextResponse.redirect(safeUrl, { status: 302 })
}
