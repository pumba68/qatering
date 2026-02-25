'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Settings,
  Play,
  Pause,
  AlertCircle,
  ChevronRight,
  Pencil,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { NodePalette } from '@/components/marketing/journey/canvas/NodePalette'
import { NodeConfigPanel } from '@/components/marketing/journey/canvas/NodeConfigPanel'
import { SettingsPanel } from '@/components/marketing/journey/canvas/SettingsPanel'
import type { Journey, CanvasContent, JourneyNodeType } from '@/components/marketing/journey/journey-types'
import { STATUS_CONFIG } from '@/components/marketing/journey/journey-types'

// React Flow requires client-only rendering
const JourneyCanvas = dynamic(
  () => import('@/components/marketing/journey/canvas/JourneyCanvas').then((m) => m.JourneyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Skeleton className="w-96 h-64 rounded-xl" />
      </div>
    ),
  }
)

export default function CanvasPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [journey, setJourney] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<JourneyNodeType | null>(null)
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, unknown>>({})

  const contentRef = useRef<CanvasContent>({ nodes: [], edges: [] })

  useEffect(() => {
    fetch(`/api/admin/marketing/journeys/${params.id}`)
      .then((r) => r.json())
      .then((data: Journey) => {
        setJourney(data)
        setNameValue(data.name)
        contentRef.current = (data.content as CanvasContent) ?? { nodes: [], edges: [] }
      })
      .catch(() => toast.error('Fehler beim Laden der Journey'))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleContentChange = useCallback((newContent: CanvasContent) => {
    contentRef.current = newContent
  }, [])

  const handleNodeSelect = useCallback(
    (nodeId: string | null, nodeType: JourneyNodeType | null, config: Record<string, unknown>) => {
      setSelectedNodeId(nodeId)
      setSelectedNodeType(nodeType)
      setSelectedNodeConfig(config)
      if (showSettings) setShowSettings(false)
    },
    [showSettings]
  )

  const handleNodeUpdate = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setSelectedNodeConfig(config)
    // Update through the canvas's exposed method
    if (typeof window !== 'undefined') {
      const updateFn = (window as unknown as Record<string, unknown>).__journeyCanvasUpdateNode as
        | ((id: string, cfg: Record<string, unknown>) => void)
        | undefined
      updateFn?.(nodeId, config)
    }
  }, [])

  const handleSave = async () => {
    if (!journey) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/marketing/journeys/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameValue || journey.name,
          content: contentRef.current,
        }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      const updated: Journey = await res.json()
      setJourney(updated)
      toast.success('Journey gespeichert')
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSettingsUpdate = useCallback(
    async (updates: Partial<Journey>) => {
      if (!journey) return
      try {
        const res = await fetch(`/api/admin/marketing/journeys/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error()
        const updated: Journey = await res.json()
        setJourney(updated)
        toast.success('Einstellungen gespeichert')
      } catch {
        toast.error('Fehler beim Speichern')
      }
    },
    [journey, params.id]
  )

  const handleActivate = async () => {
    if (!journey) return
    setActivating(true)
    setValidationErrors([])
    try {
      // Save first
      await fetch(`/api/admin/marketing/journeys/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentRef.current }),
      })

      const res = await fetch(`/api/admin/marketing/journeys/${params.id}/activate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) {
          setValidationErrors(data.errors)
          toast.error(`Validierung fehlgeschlagen (${data.errors.length} Fehler)`)
        } else {
          toast.error(data.error ?? 'Fehler beim Aktivieren')
        }
        return
      }
      setJourney(data)
      toast.success('Journey aktiviert!')
    } catch {
      toast.error('Fehler beim Aktivieren')
    } finally {
      setActivating(false)
    }
  }

  const handlePauseResume = async () => {
    if (!journey) return
    const isPaused = journey.status === 'PAUSED'
    const url = `/api/admin/marketing/journeys/${params.id}/${isPaused ? 'resume' : 'pause'}`
    try {
      const res = await fetch(url, { method: 'POST' })
      const updated: Journey = await res.json()
      setJourney(updated)
      toast.success(isPaused ? 'Journey fortgesetzt' : 'Journey pausiert')
    } catch {
      toast.error('Fehler')
    }
  }

  const handleNameSave = async () => {
    if (!journey || !nameValue.trim()) return
    setEditingName(false)
    await handleSave()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="w-64 h-8" />
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Journey nicht gefunden</p>
        <Button variant="outline" asChild>
          <Link href="/admin/marketing/journeys">Zurück zur Liste</Link>
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[journey.status]
  const canActivate = journey.status === 'DRAFT'
  const canPauseResume = journey.status === 'ACTIVE' || journey.status === 'PAUSED'

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-white flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin/marketing/journeys">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <ChevronRight className="w-4 h-4 text-gray-300" />

          {/* Inline name edit */}
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-8 text-sm font-semibold w-64"
                autoFocus
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleNameSave}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600 group"
              onClick={() => setEditingName(true)}
            >
              {journey.name}
              <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <Badge className={`text-xs ${statusCfg.color} border-0 ml-0.5`}>{statusCfg.label}</Badge>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationErrors.length} Fehler
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {validationErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              setShowSettings((s) => !s)
              setSelectedNodeId(null)
            }}
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Einstellungen
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>

          {canActivate && (
            <Button size="sm" className="h-8" onClick={handleActivate} disabled={activating}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {activating ? 'Aktivieren...' : 'Aktivieren'}
            </Button>
          )}

          {canPauseResume && (
            <Button
              size="sm"
              variant={journey.status === 'ACTIVE' ? 'outline' : 'default'}
              className="h-8"
              onClick={handlePauseResume}
            >
              {journey.status === 'ACTIVE' ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pausieren
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Fortsetzen
                </>
              )}
            </Button>
          )}
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left: Node Palette */}
          <NodePalette />

          {/* Center: Canvas */}
          <div className="flex-1 min-w-0 bg-gray-50">
            <JourneyCanvas
              content={contentRef.current}
              readOnly={journey.status === 'ARCHIVED'}
              onContentChange={handleContentChange}
              onNodeSelect={handleNodeSelect}
            />
          </div>

          {/* Right: Node Config Panel */}
          {selectedNodeId && selectedNodeType && !showSettings && (
            <NodeConfigPanel
              nodeId={selectedNodeId}
              nodeType={selectedNodeType}
              config={selectedNodeConfig}
              onUpdate={handleNodeUpdate}
              onClose={() => setSelectedNodeId(null)}
            />
          )}

          {/* Settings slide-out */}
          {showSettings && (
            <SettingsPanel
              journey={journey}
              onUpdate={handleSettingsUpdate}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
