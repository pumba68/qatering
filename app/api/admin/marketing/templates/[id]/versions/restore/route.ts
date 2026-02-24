export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/src/generated/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

// POST /api/admin/marketing/templates/[id]/versions/restore
// Body: { versionId: string }
// Restores a version snapshot to the template's current content.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminRole()
  if (error) return error

  const templateId = params.id

  try {
    const body = await req.json() as { versionId: string }
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json({ error: 'versionId fehlt' }, { status: 400 })
    }

    const version = await prisma.marketingTemplateVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.templateId !== templateId) {
      return NextResponse.json({ error: 'Version nicht gefunden' }, { status: 404 })
    }

    await prisma.marketingTemplate.update({
      where: { id: templateId },
      data: { content: version.content ?? Prisma.JsonNull },
    })

    return NextResponse.json({ ok: true, restoredContent: version.content })
  } catch (err) {
    console.error('Fehler beim Wiederherstellen der Version:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
