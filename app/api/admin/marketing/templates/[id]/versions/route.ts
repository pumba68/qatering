export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

const MAX_VERSIONS = 10

// GET /api/admin/marketing/templates/[id]/versions
// Returns the last 10 version snapshots for a template (newest first)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminRole()
  if (error) return error

  const templateId = params.id

  try {
    const versions = await prisma.marketingTemplateVersion.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
      take: MAX_VERSIONS,
      select: { id: true, savedBy: true, createdAt: true },
    })

    return NextResponse.json({ versions })
  } catch (err) {
    console.error('Fehler beim Laden der Versionshistorie:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST /api/admin/marketing/templates/[id]/versions
// Creates a new version snapshot. Trims to MAX_VERSIONS using FIFO.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminRole()
  if (error) return error

  const templateId = params.id

  try {
    const body = await req.json() as { content: unknown; savedBy?: string }

    // Verify template exists
    const template = await prisma.marketingTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    // FIFO: remove oldest version if we're at the limit
    const count = await prisma.marketingTemplateVersion.count({ where: { templateId } })
    if (count >= MAX_VERSIONS) {
      const oldest = await prisma.marketingTemplateVersion.findFirst({
        where: { templateId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      if (oldest) {
        await prisma.marketingTemplateVersion.delete({ where: { id: oldest.id } })
      }
    }

    const version = await prisma.marketingTemplateVersion.create({
      data: {
        templateId,
        content: body.content ?? {},
        savedBy: body.savedBy ?? 'manual',
      },
      select: { id: true, savedBy: true, createdAt: true },
    })

    return NextResponse.json({ version }, { status: 201 })
  } catch (err) {
    console.error('Fehler beim Erstellen der Version:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
