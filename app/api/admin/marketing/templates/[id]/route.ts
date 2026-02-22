export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/src/generated/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.record(z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  isFavorite: z.boolean().optional(),
  thumbnailUrl: z.string().optional().nullable(),
  // PROJ-9: E-Mail-Einstellungen
  subjectLine: z.string().max(80).optional().nullable(),
  preheaderText: z.string().max(150).optional().nullable(),
  senderName: z.string().max(100).optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const template = await prisma.marketingTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { organizationId: ctx.organizationId },
          { isStarter: true },
        ],
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('GET /api/admin/marketing/templates/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const existing = await prisma.marketingTemplate.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const template = await prisma.marketingTemplate.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.content !== undefined && { content: parsed.data.content as Prisma.InputJsonValue }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.isFavorite !== undefined && { isFavorite: parsed.data.isFavorite }),
        ...(parsed.data.thumbnailUrl !== undefined && { thumbnailUrl: parsed.data.thumbnailUrl }),
        // PROJ-9: E-Mail-Einstellungen
        ...(parsed.data.subjectLine !== undefined && { subjectLine: parsed.data.subjectLine }),
        ...(parsed.data.preheaderText !== undefined && { preheaderText: parsed.data.preheaderText }),
        ...(parsed.data.senderName !== undefined && { senderName: parsed.data.senderName }),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('PUT /api/admin/marketing/templates/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const existing = await prisma.marketingTemplate.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId, isStarter: false },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Template nicht gefunden oder nicht löschbar' },
        { status: 404 }
      )
    }

    await prisma.marketingTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/marketing/templates/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
