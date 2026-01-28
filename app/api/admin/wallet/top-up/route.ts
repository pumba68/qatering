import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-helpers'
import { topUp, MIN_TOP_UP, MAX_TOP_UP } from '@/lib/wallet'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().min(1, 'Benutzer erforderlich'),
  amount: z.number().min(MIN_TOP_UP).max(MAX_TOP_UP),
  note: z.string().optional(),
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

    const wallet = await topUp(parsed.userId, parsed.amount, {
      note: parsed.note || undefined,
      performedById,
    })

    return NextResponse.json({
      success: true,
      balance: Number(wallet.balance),
      message: `${parsed.amount.toFixed(2)} € erfolgreich aufgeladen.`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('Betrag muss')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Fehler beim Aufladen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
