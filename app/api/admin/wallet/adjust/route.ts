import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-helpers'
import { adjust } from '@/lib/wallet'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().min(1, 'Benutzer erforderlich'),
  delta: z.number().refine((v) => v !== 0, 'Delta darf nicht 0 sein'),
  reason: z.string().min(1, 'Grund erforderlich'),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const performedById = (auth.user as { id?: string })?.id
    if (!performedById) {
      return NextResponse.json({ error: 'Admin-Session ungültig' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.parse(body)

    await adjust(parsed.userId, parsed.delta, {
      reason: parsed.reason,
      performedById,
    })

    return NextResponse.json({
      success: true,
      message: 'Guthaben angepasst.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && (error.message.includes('Anpassung') || error.message.includes('negatives Guthaben'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Fehler bei Anpassung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
