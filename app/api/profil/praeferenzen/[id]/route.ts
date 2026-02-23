export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['confirm', 'ignore']),
})

/**
 * PATCH /api/profil/praeferenzen/[id]
 * Confirm or ignore a DERIVED preference suggestion
 * - confirm: set type=EXPLICIT, source=USER, ignored=false
 * - ignore: set ignored=true
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!
  const { id } = await params

  try {
    const body = await request.json()
    const { action } = actionSchema.parse(body)

    // Find and verify ownership
    const pref = await prisma.customerPreference.findUnique({
      where: { id },
      select: { userId: true, type: true, source: true },
    })

    if (!pref) {
      return NextResponse.json(
        { error: 'Präferenz nicht gefunden' },
        { status: 404 }
      )
    }

    if (pref.userId !== userId) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Präferenz' },
        { status: 403 }
      )
    }

    if (action === 'confirm') {
      // Change DERIVED to EXPLICIT
      await prisma.customerPreference.update({
        where: { id },
        data: {
          type: 'EXPLICIT',
          source: 'USER',
          ignored: false,
        },
      })
    } else if (action === 'ignore') {
      // Mark as ignored
      await prisma.customerPreference.update({
        where: { id },
        data: { ignored: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler beim Verarbeiten der Präferenz-Aktion:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
