export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/email-track/open/[token] — Tracking-Pixel für E-Mail-Öffnungen */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Stille Aktualisierung: kein Error wenn Token nicht gefunden
  try {
    const log = await prisma.emailCampaignLog.findUnique({
      where: { trackingToken: params.token },
    })
    if (log && !log.openedAt) {
      await prisma.emailCampaignLog.update({
        where: { id: log.id },
        data: { openedAt: new Date(), status: 'OPENED' },
      })
    }
  } catch {
    // Tracking-Fehler sind nicht kritisch
  }

  // 1x1 transparentes PNG zurückgeben
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(pixel.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
