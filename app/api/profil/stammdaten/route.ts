export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'
import { z } from 'zod'

const updateNameSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(200, 'Name zu lang').trim(),
})

/**
 * PATCH /api/profil/stammdaten
 * Update user name. Does not update session automatically — client must call useSession.update()
 */
export async function PATCH(request: NextRequest) {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const body = await request.json()
    const { name } = updateNameSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAnonymous: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Anonymous accounts cannot change their name
    if (user.isAnonymous) {
      return NextResponse.json(
        { error: 'Anonyme Konten können den Namen nicht ändern' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true },
    })

    return NextResponse.json({ success: true, name: updated.name })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Fehler bei Name-Update:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
