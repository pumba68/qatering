'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  Loader2,
  Check,
  AlertCircle,
  Palette,
  Send,
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

import {
  Block,
  BlockType,
  GlobalStyle,
  TemplateContent,
  DEFAULT_GLOBAL_STYLE,
  DEFAULT_BLOCK_PROPS,
  generateId,
} from '@/components/marketing/editor/editor-types'
import { BlockPalette } from '@/components/marketing/editor/BlockPalette'
import { EditorCanvas } from '@/components/marketing/editor/EditorCanvas'
import { BlockRendererSwitch } from '@/components/marketing/editor/BlockRenderer'
import { PropertiesPanel } from '@/components/marketing/editor/PropertiesPanel'
import { PublishDialog } from '@/components/marketing/editor/PublishDialog'

// ─── Types ───────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface HistoryEntry {
  blocks: Block[]
  globalStyle: GlobalStyle
}

const MAX_HISTORY = 20
const AUTOSAVE_INTERVAL_MS = 60_000

// ─── Top Bar ─────────────────────────────────────────────────────────────────

interface TopbarProps {
  templateName: string
  saveStatus: SaveStatus
  canUndo: boolean
  canRedo: boolean
  previewWidth: number
  showGlobalStyle: boolean
  isStarter: boolean
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onPreviewWidthChange: (w: number) => void
  onToggleGlobalStyle: () => void
  onSave: () => void
  onPublish: () => void
}

function EditorTopbar({
  templateName,
  saveStatus,
  canUndo,
  canRedo,
  previewWidth,
  showGlobalStyle,
  isStarter,
  onNameChange,
  onUndo,
  onRedo,
  onPreviewWidthChange,
  onToggleGlobalStyle,
  onSave,
  onPublish,
}: TopbarProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [localName, setLocalName] = React.useState(templateName)

  React.useEffect(() => setLocalName(templateName), [templateName])

  const SaveIcon =
    saveStatus === 'saving' ? Loader2
    : saveStatus === 'saved' ? Check
    : saveStatus === 'error' ? AlertCircle
    : Save

  const saveLabel =
    saveStatus === 'saving' ? 'Speichern...'
    : saveStatus === 'saved' ? 'Gespeichert'
    : saveStatus === 'error' ? 'Fehler'
    : 'Speichern'

  return (
    <div className="flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 shrink-0 z-20">
      <Link
        href="/admin/marketing/templates"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mr-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Vorlagen
      </Link>

      <div className="w-px h-6 bg-gray-200" />

      {editingName ? (
        <Input
          autoFocus
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => {
            setEditingName(false)
            if (localName.trim()) onNameChange(localName.trim())
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { setEditingName(false); if (localName.trim()) onNameChange(localName.trim()) }
            if (e.key === 'Escape') { setEditingName(false); setLocalName(templateName) }
          }}
          className="h-8 w-56 text-sm font-medium"
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-sm font-medium text-gray-800 hover:text-violet-600 hover:underline underline-offset-2 transition-colors max-w-xs truncate"
          title="Name bearbeiten"
        >
          {templateName || 'Vorlage ohne Name'}
        </button>
      )}

      <div className="flex-1" />

      <TooltipProvider delayDuration={0}>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={onUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Rückgängig (Ctrl+Z)</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={onRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Wiederholen (Ctrl+Y)</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onPreviewWidthChange(600)}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                  previewWidth === 600 ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Desktop (600px)</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onPreviewWidthChange(375)}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                  previewWidth === 375 ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Mobil (375px)</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showGlobalStyle ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleGlobalStyle}
            >
              <Palette className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Globale Stile</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200" />

        <Button
          size="sm"
          className={cn(
            'h-8 gap-1.5 transition-colors',
            saveStatus === 'saved' && 'bg-green-600 hover:bg-green-700',
            saveStatus === 'error' && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={onSave}
          disabled={saveStatus === 'saving'}
        >
          <SaveIcon className={cn('w-3.5 h-3.5', saveStatus === 'saving' && 'animate-spin')} />
          {saveLabel}
        </Button>

        {!isStarter && (
          <>
            <div className="w-px h-6 bg-gray-200" />
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700"
              onClick={onPublish}
            >
              <Send className="w-3.5 h-3.5" />
              Veröffentlichen
            </Button>
          </>
        )}
      </TooltipProvider>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params?.id as string

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [templateName, setTemplateName] = React.useState('Vorlage')
  const [isStarter, setIsStarter] = React.useState(false)

  const [blocks, setBlocksRaw] = React.useState<Block[]>([])
  const [globalStyle, setGlobalStyleRaw] = React.useState<GlobalStyle>(DEFAULT_GLOBAL_STYLE)
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null)
  const [showGlobalStyle, setShowGlobalStyle] = React.useState(false)
  const [previewWidth, setPreviewWidth] = React.useState<number>(600)

  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const [publishOpen, setPublishOpen] = React.useState(false)
  const autosaveTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const isDirtyRef = React.useRef(false)

  // ── DnD ───────────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeBlock, setActiveBlock] = React.useState<Block | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Load Template ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!templateId) return
    fetch(`/api/admin/marketing/templates/${templateId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setTemplateName(data.name || 'Vorlage')
        setIsStarter(data.isStarter || false)

        const content: Partial<TemplateContent> =
          typeof data.content === 'object' && data.content ? data.content : {}
        const loadedBlocks: Block[] = Array.isArray(content.blocks) ? content.blocks : []
        const loadedStyle: GlobalStyle = { ...DEFAULT_GLOBAL_STYLE, ...content.globalStyle }

        setBlocksRaw(loadedBlocks)
        setGlobalStyleRaw(loadedStyle)
        const initial: HistoryEntry = { blocks: loadedBlocks, globalStyle: loadedStyle }
        setHistory([initial])
        setHistoryIndex(0)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [templateId])

  // ── History ────────────────────────────────────────────────────────────────
  const pushHistory = React.useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const next = [...trimmed, entry].slice(-MAX_HISTORY)
      setHistoryIndex(next.length - 1)
      return next
    })
    isDirtyRef.current = true
  }, [historyIndex])

  const setBlocks = React.useCallback((next: Block[] | ((prev: Block[]) => Block[])) => {
    setBlocksRaw((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      pushHistory({ blocks: resolved, globalStyle })
      return resolved
    })
  }, [pushHistory, globalStyle])

  const setGlobalStyle = React.useCallback((next: GlobalStyle | ((prev: GlobalStyle) => GlobalStyle)) => {
    setGlobalStyleRaw((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      pushHistory({ blocks, globalStyle: resolved })
      return resolved
    })
  }, [pushHistory, blocks])

  const handleUndo = React.useCallback(() => {
    if (historyIndex <= 0) return
    const idx = historyIndex - 1
    const entry = history[idx]
    setBlocksRaw(entry.blocks)
    setGlobalStyleRaw(entry.globalStyle)
    setHistoryIndex(idx)
    isDirtyRef.current = true
  }, [history, historyIndex])

  const handleRedo = React.useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const idx = historyIndex + 1
    const entry = history[idx]
    setBlocksRaw(entry.blocks)
    setGlobalStyleRaw(entry.globalStyle)
    setHistoryIndex(idx)
    isDirtyRef.current = true
  }, [history, historyIndex])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUndo, handleRedo])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = React.useCallback(async (silent = false) => {
    if (isStarter) {
      toast.error('Starter-Vorlagen können nicht gespeichert werden. Bitte zuerst duplizieren.')
      return
    }
    setSaveStatus('saving')
    try {
      const content: TemplateContent = { globalStyle, blocks }
      const res = await fetch(`/api/admin/marketing/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName, content }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveStatus('saved')
      isDirtyRef.current = false
      if (!silent) toast.success('Vorlage gespeichert')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      if (!silent) toast.error('Speichern fehlgeschlagen')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [blocks, globalStyle, templateId, templateName, isStarter])

  // ── Autosave ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    autosaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current && !isStarter) handleSave(true)
    }, AUTOSAVE_INTERVAL_MS)
    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current) }
  }, [handleSave, isStarter])

  // ── Block / GlobalStyle updates ───────────────────────────────────────────
  const handleBlockChange = React.useCallback(
    (blockId: string, newProps: Partial<Block['props']>) => {
      setBlocks((prev) =>
        prev.map((b) => b.id === blockId ? { ...b, props: { ...b.props, ...newProps } } : b)
      )
    },
    [setBlocks]
  )

  const handleGlobalStyleChange = React.useCallback(
    (patch: Partial<GlobalStyle>) => { setGlobalStyle((prev) => ({ ...prev, ...patch })) },
    [setGlobalStyle]
  )

  // ── DnD handlers ─────────────────────────────────────────────────────────
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveId(id)

    if (event.active.data.current?.fromPalette) {
      const blockType = event.active.data.current.blockType as BlockType
      setActiveBlock({
        id: 'preview',
        type: blockType,
        props: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPS[blockType])),
      })
    } else {
      // Reordering an existing canvas block
      const existing = blocks.find((b) => b.id === id)
      if (existing) setActiveBlock(existing)
    }
  }, [blocks])

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveBlock(null)

    if (!over) return

    const activeData = active.data.current

    // ── Drop from palette ──────────────────────────────────────────────────
    if (activeData?.fromPalette) {
      const blockType = activeData.blockType as BlockType
      const newBlock: Block = {
        id: generateId(),
        type: blockType,
        props: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPS[blockType])),
      }

      const overId = String(over.id)

      setBlocks((prev) => {
        if (overId === 'canvas' || overId === 'canvas-drop-zone') {
          return [...prev, newBlock]
        }
        const overIndex = prev.findIndex((b) => b.id === overId)
        if (overIndex !== -1) {
          const next = [...prev]
          next.splice(overIndex + 1, 0, newBlock)
          return next
        }
        return [...prev, newBlock]
      })

      setSelectedBlockId(newBlock.id)
      setShowGlobalStyle(false)
      return
    }

    // ── Reorder canvas blocks ──────────────────────────────────────────────
    const activeBlockId = String(active.id)
    const overBlockId = String(over.id)
    if (activeBlockId !== overBlockId) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === activeBlockId)
        const newIndex = prev.findIndex((b) => b.id === overBlockId)
        if (oldIndex !== -1 && newIndex !== -1) return arrayMove(prev, oldIndex, newIndex)
        return prev
      })
    }
  }, [setBlocks])

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-gray-700">Vorlage nicht gefunden</h2>
        <Button variant="outline" onClick={() => router.push('/admin/marketing/templates')}>
          Zurück zur Übersicht
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col -m-4 overflow-hidden bg-gray-100" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Starter banner */}
      {isStarter && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 shrink-0">
          <AlertCircle className="w-4 h-4" />
          Dies ist eine schreibgeschützte Starter-Vorlage. Bitte duplizieren Sie sie, um sie zu bearbeiten.
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs ml-2 border-amber-400 text-amber-700 hover:bg-amber-100"
            onClick={async () => {
              const res = await fetch(`/api/admin/marketing/templates/${templateId}/duplicate`, { method: 'POST' })
              if (res.ok) {
                const copy = await res.json()
                toast.success('Kopie erstellt')
                router.push(`/admin/marketing/templates/${copy.id}/editor`)
              } else {
                toast.error('Duplizieren fehlgeschlagen')
              }
            }}
          >
            Duplizieren & bearbeiten
          </Button>
        </div>
      )}

      {/* Top Bar */}
      <EditorTopbar
        templateName={templateName}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        previewWidth={previewWidth}
        showGlobalStyle={showGlobalStyle}
        isStarter={isStarter}
        onNameChange={setTemplateName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreviewWidthChange={setPreviewWidth}
        onToggleGlobalStyle={() => {
          setShowGlobalStyle((v) => !v)
          if (!showGlobalStyle) setSelectedBlockId(null)
        }}
        onSave={() => handleSave(false)}
        onPublish={() => setPublishOpen(true)}
      />

      {/* 3-Column Layout — all inside one DndContext so palette + canvas share it */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Block Palette */}
          <BlockPalette />

          {/* Center: Canvas */}
          <main className="flex-1 overflow-y-auto p-6">
            <EditorCanvas
              blocks={blocks}
              globalStyle={globalStyle}
              selectedBlockId={selectedBlockId}
              previewWidth={previewWidth}
              activeId={activeId}
              onBlocksChange={setBlocks}
              onSelectBlock={(id) => {
                setSelectedBlockId(id)
                if (id !== null) setShowGlobalStyle(false)
              }}
            />
          </main>

          {/* Right: Properties Panel */}
          <aside className="w-72 shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
            <PropertiesPanel
              selectedBlock={selectedBlock}
              globalStyle={globalStyle}
              showGlobalStyle={showGlobalStyle}
              onBlockChange={handleBlockChange}
              onGlobalStyleChange={handleGlobalStyleChange}
            />
          </aside>
        </div>

        {/* Drag overlay — shown while dragging (both palette items and canvas blocks) */}
        <DragOverlay dropAnimation={null}>
          {activeBlock ? (
            <div className="opacity-80 shadow-2xl rounded-lg overflow-hidden pointer-events-none max-w-xs rotate-1 scale-105">
              <BlockRendererSwitch block={activeBlock} globalStyle={globalStyle} isPreview />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        templateId={templateId}
        templateName={templateName}
      />
    </div>
  )
}
