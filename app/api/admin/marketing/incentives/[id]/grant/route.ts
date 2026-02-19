import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { grantIncentiveToSegment } from '@/lib/incentive-grant'

// POST: Incentive manuell an Segment ausspielen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params

    const result = await grantIncentiveToSegment(id, {
      organizationId: ctx.organizationId,
      allowedLocationIds: ctx.allowedLocationIds,
    })

    return NextResponse.json({
      granted: result.granted,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Fehler bei Incentive-Ausspielung:', error)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
