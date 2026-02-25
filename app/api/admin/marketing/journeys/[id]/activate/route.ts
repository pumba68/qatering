export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminContext } from '@/lib/admin-helpers'

interface CanvasNode {
  id: string
  type: string
  config?: Record<string, unknown>
}

interface CanvasEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
}

interface CanvasContent {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function validateCanvas(content: CanvasContent): string[] {
  const errors: string[] = []
  const { nodes, edges } = content

  if (!nodes || nodes.length === 0) {
    errors.push('Der Canvas muss mindestens einen Node enthalten')
    return errors
  }

  const startNodes = nodes.filter((n) => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push('Kein Start-Node vorhanden')
  }
  if (startNodes.length > 1) {
    errors.push('Nur ein Start-Node erlaubt')
  }

  // Start node must have at least one outgoing edge
  for (const startNode of startNodes) {
    const outgoing = edges.filter((e) => e.source === startNode.id)
    if (outgoing.length === 0) {
      errors.push('Start-Node hat keine ausgehende Verbindung')
    }
  }

  // All channel nodes must have a template assigned
  for (const node of nodes) {
    if (['email', 'inapp', 'push'].includes(node.type)) {
      const cfg = node.config as { templateId?: string } | undefined
      if (!cfg?.templateId) {
        errors.push(`Node "${node.id}" (${node.type}): Kein Template zugewiesen`)
      }
    }

    // Branch nodes must have both yes and no outgoing edges
    if (node.type === 'branch') {
      const yesEdge = edges.find((e) => e.source === node.id && e.sourceHandle === 'yes')
      const noEdge = edges.find((e) => e.source === node.id && e.sourceHandle === 'no')
      if (!yesEdge) {
        errors.push(`Bedingungsknoten "${node.id}": JA-Pfad fehlt`)
      }
      if (!noEdge) {
        errors.push(`Bedingungsknoten "${node.id}": NEIN-Pfad fehlt`)
      }
    }
  }

  // Cycle detection (DFS)
  const adjList: Record<string, string[]> = {}
  for (const node of nodes) {
    adjList[node.id] = []
  }
  for (const edge of edges) {
    if (adjList[edge.source]) {
      adjList[edge.source].push(edge.target)
    }
  }

  const visited = new Set<string>()
  const stack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    if (stack.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    visited.add(nodeId)
    stack.add(nodeId)
    for (const neighbor of adjList[nodeId] ?? []) {
      if (hasCycle(neighbor)) return true
    }
    stack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      errors.push('Canvas enthält einen Zyklus — bitte entfernen')
      break
    }
  }

  return errors
}

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

    const journey = await prisma.journey.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!journey) {
      return NextResponse.json({ error: 'Journey nicht gefunden' }, { status: 404 })
    }
    if (journey.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Nur Entwürfe können aktiviert werden' },
        { status: 400 }
      )
    }

    const content = journey.content as unknown as CanvasContent
    const errors = validateCanvas(content)
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validierung fehlgeschlagen', errors }, { status: 422 })
    }

    const updated = await prisma.journey.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        startDate: journey.startDate ?? new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/admin/marketing/journeys/[id]/activate error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
