import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

/** GET: Ausführungsprotokoll eines Workflows (letzte N Einträge) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { id } = await params
    const workflow = await prisma.marketingWorkflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    })
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    const logs = await prisma.workflowExecutionLog.findMany({
      where: { workflowId: id },
      orderBy: { executedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Fehler beim Abrufen der Workflow-Logs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
