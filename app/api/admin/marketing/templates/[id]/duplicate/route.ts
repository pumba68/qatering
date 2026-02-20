import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/src/generated/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const source = await prisma.marketingTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { organizationId: ctx.organizationId },
          { isStarter: true },
        ],
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    const copy = await prisma.marketingTemplate.create({
      data: {
        organizationId: ctx.organizationId,
        name: `${source.name} (Kopie)`,
        type: source.type,
        content: source.content as Prisma.InputJsonValue,
        status: 'ACTIVE',
        isStarter: false,
        isFavorite: false,
      },
    })

    return NextResponse.json(copy, { status: 201 })
  } catch (error) {
    console.error('POST /duplicate error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
