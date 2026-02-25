'use client'

import { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

import StartNode from './nodes/StartNode'
import DelayNode from './nodes/DelayNode'
import EmailNode from './nodes/EmailNode'
import InAppNode from './nodes/InAppNode'
import PushNode from './nodes/PushNode'
import BranchNode from './nodes/BranchNode'
import IncentiveNode from './nodes/IncentiveNode'
import EndNode from './nodes/EndNode'

import type { CanvasContent, CanvasNode, JourneyNodeType } from '../journey-types'
import { DEFAULT_NODE_CONFIGS } from '../journey-types'

// Map node types to React Flow custom components
const nodeTypes = {
  start: StartNode,
  delay: DelayNode,
  email: EmailNode,
  inapp: InAppNode,
  push: PushNode,
  branch: BranchNode,
  incentive: IncentiveNode,
  end: EndNode,
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function canvasToFlow(content: CanvasContent): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (content.nodes ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { config: n.config, label: n.label ?? '' },
  }))

  const edges: Edge[] = (content.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle ?? null,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    animated: false,
  }))

  return { nodes, edges }
}

function flowToCanvas(nodes: Node[], edges: Edge[]): CanvasContent {
  const canvasNodes: CanvasNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type as JourneyNodeType,
    position: n.position,
    config: n.data?.config ?? {},
    label: n.data?.label ?? '',
  }))

  const canvasEdges = edges.map((e) => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle ?? 'output',
    target: e.target,
    targetHandle: e.targetHandle ?? undefined,
  }))

  return { nodes: canvasNodes, edges: canvasEdges }
}

interface JourneyCanvasProps {
  content: CanvasContent
  readOnly?: boolean
  onContentChange?: (content: CanvasContent) => void
  onNodeSelect?: (nodeId: string | null, nodeType: JourneyNodeType | null, config: Record<string, unknown>) => void
  nodeStats?: Record<string, number> // nodeId → active participant count
}

export function JourneyCanvas({
  content,
  readOnly = false,
  onContentChange,
  onNodeSelect,
  nodeStats,
}: JourneyCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = canvasToFlow(content)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  const handleConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return
      const newEdge: Edge = {
        ...params,
        id: `e-${generateId()}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      } as Edge
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds)
        onContentChange?.(flowToCanvas(nodes, updated))
        return updated
      })
    },
    [readOnly, nodes, setEdges, onContentChange]
  )

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes)
    },
    [onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node.id, node.type as JourneyNodeType, node.data?.config ?? {})
    },
    [onNodeSelect]
  )

  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null, null, {})
  }, [onNodeSelect])

  // Expose method to add nodes from palette drop
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (readOnly) return
      event.preventDefault()
      const type = event.dataTransfer.getData('application/journey-node') as JourneyNodeType
      if (!type) return

      const rfEl = (event.target as HTMLElement).closest('.react-flow') as HTMLElement
      if (!rfEl || !rfInstance.current) return

      const bounds = rfEl.getBoundingClientRect()
      const position = rfInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: {
          config: JSON.parse(JSON.stringify(DEFAULT_NODE_CONFIGS[type])),
          label: '',
        },
      }

      setNodes((nds) => {
        const updated = [...nds, newNode]
        onContentChange?.(flowToCanvas(updated, edges))
        return updated
      })

      // Auto-select the new node
      onNodeSelect?.(newNode.id, type, newNode.data.config)
    },
    [readOnly, edges, setNodes, onContentChange, onNodeSelect]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Update node config from panel
  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
        )
        onContentChange?.(flowToCanvas(updated, edges))
        return updated
      })
    },
    [edges, setNodes, onContentChange]
  )

  // Attach updateNodeConfig to window for external access
  // (used by NodeConfigPanel)
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__journeyCanvasUpdateNode = updateNodeConfig
  }

  // Render node stat badges on top of nodes
  const nodesWithStats: Node[] = nodes.map((n) => {
    const count = nodeStats?.[n.id]
    return {
      ...n,
      data: {
        ...n.data,
        config: n.data?.config ?? {},
        activeBadge: count !== undefined && count > 0 ? count : undefined,
      },
    }
  })

  return (
    <div className="w-full h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
      <ReactFlow
        nodes={nodesWithStats}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onInit={(instance) => { rfInstance.current = instance }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        deleteKeyCode={readOnly ? null : 'Delete'}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const colorMap: Record<string, string> = {
              start: '#7c3aed',
              delay: '#6b7280',
              email: '#2563eb',
              inapp: '#7c3aed',
              push: '#16a34a',
              branch: '#ca8a04',
              incentive: '#ea580c',
              end: '#374151',
            }
            return colorMap[n.type ?? ''] ?? '#94a3b8'
          }}
          zoomable
          pannable
          className="!bg-gray-50 !border !border-gray-200"
        />
      </ReactFlow>
    </div>
  )
}
