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
  ShieldCheck,
  History,
  X,
  Mail,
  Bell,
  Layers,
  Megaphone,
  AlertTriangle,
  RotateCcw,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ColumnsBlockProps,
  EditorChannel,
  GlobalStyle,
  TemplateContent,
  DEFAULT_GLOBAL_STYLE,
  DEFAULT_BLOCK_PROPS,
  DEFAULT_PADDING,
  generateId,
  createBlock,
} from '@/components/marketing/editor/editor-types'
import { BlockPalette } from '@/components/marketing/editor/BlockPalette'
import { EditorCanvas } from '@/components/marketing/editor/EditorCanvas'
import { BlockRendererSwitch } from '@/components/marketing/editor/BlockRenderer'
import { PropertiesPanel } from '@/components/marketing/editor/PropertiesPanel'
import { PublishDialog } from '@/components/marketing/editor/PublishDialog'

// ─── Recursive Block Helpers ──────────────────────────────────────────────────

function findBlockById(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.type === 'columns2' || b.type === 'columns3') {
      const cols = (b.props as ColumnsBlockProps).columns ?? []
      for (const col of cols) {
        const found = findBlockById(col, id)
        if (found) return found
      }
    }
  }
  return null
}

function updateBlockById(blocks: Block[], blockId: string, updates: Partial<Block>): Block[] {
  return blocks.map((b) => {
    if (b.id === blockId) {
      return { ...b, ...updates, props: updates.props ? { ...b.props, ...updates.props } : b.props }
    }
    if (b.type === 'columns2' || b.type === 'columns3') {
      const colProps = b.props as ColumnsBlockProps
      const newCols = colProps.columns.map((col) => updateBlockById(col, blockId, updates))
      const changed = newCols.some((col, i) => col !== colProps.columns[i])
      if (changed) return { ...b, props: { ...colProps, columns: newCols } }
    }
    return b
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface HistoryEntry {
  blocks: Block[]
  globalStyle: GlobalStyle
}

interface VersionEntry {
  id: string
  savedBy: string | null
  createdAt: string
}

const MAX_HISTORY = 30
const AUTOSAVE_INTERVAL_MS = 60_000

// ─── Channel Config ───────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EMAIL:             { label: 'E-Mail',     color: 'bg-blue-100 text-blue-700',     icon: Mail },
  IN_APP_BANNER:     { label: 'In-App',     color: 'bg-purple-100 text-purple-700', icon: Layers },
  PROMOTION_BANNER:  { label: 'Banner',     color: 'bg-orange-100 text-orange-700', icon: Megaphone },
  PUSH:              { label: 'Push',       color: 'bg-green-100 text-green-700',   icon: Bell },
}

// ─── Accessibility Checker ────────────────────────────────────────────────────

interface AccessibilityIssue {
  blockId: string
  blockType: string
  message: string
}

function checkAccessibility(blocks: Block[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const check = (blockList: Block[]) => {
    blockList.forEach((b) => {
      const p = b.props as unknown as Record<string, unknown>
      if (b.type === 'image') {
        if (!p.altText || String(p.altText).trim() === '') {
          issues.push({ blockId: b.id, blockType: b.type, message: 'Bild ohne Alt-Text' })
        }
      }
      if (b.type === 'button') {
        if (!p.label || String(p.label).trim() === '') {
          issues.push({ blockId: b.id, blockType: b.type, message: 'Button ohne Beschriftung' })
        }
        if (!p.url || String(p.url).trim() === '') {
          issues.push({ blockId: b.id, blockType: b.type, message: 'Button ohne Link-URL' })
        }
      }
      if (b.type === 'video' && !p.altText) {
        issues.push({ blockId: b.id, blockType: b.type, message: 'Video ohne Alt-Text' })
      }
      if (b.type === 'gif' && !p.altText) {
        issues.push({ blockId: b.id, blockType: b.type, message: 'GIF ohne Alt-Text' })
      }
      // Recurse into columns
      if ((b.type === 'columns2' || b.type === 'columns3') && Array.isArray(p.columns)) {
        (p.columns as Block[][]).forEach((col) => check(col))
      }
    })
  }
  check(blocks)
  return issues
}

// ─── Spam Score ───────────────────────────────────────────────────────────────

const SPAM_KEYWORDS = [
  'GRATIS', 'FREE', 'GEWINN', 'GEWINNER', 'CLICK HERE', 'HIER KLICKEN',
  'BUY NOW', 'JETZT KAUFEN', 'MONEY BACK', 'GELD ZURÜCK', '!!!', '100%',
  'GARANTIERT', 'SOFORT', 'RISIKOFREI',
]

function computeSpamScore(blocks: Block[], subjectLine: string, preheaderText: string): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  const subjectUpper = subjectLine.toUpperCase()
  SPAM_KEYWORDS.forEach((kw) => {
    if (subjectUpper.includes(kw)) {
      score += 1.5
      reasons.push(`Spam-Schlüsselwort im Betreff: "${kw}"`)
    }
  })

  if (!preheaderText.trim()) { score += 0.5; reasons.push('Kein Vorschautext angegeben') }

  let imageCount = 0
  let textLength = 0
  const scan = (blockList: Block[]) => {
    blockList.forEach((b) => {
      if (b.type === 'image' || b.type === 'gif' || b.type === 'video') imageCount++
      if (b.type === 'text' || b.type === 'headline' || b.type === 'list') {
        const p = b.props as { content?: string }
        textLength += (p.content || '').length
      }
      if ((b.type === 'columns2' || b.type === 'columns3') && Array.isArray((b.props as unknown as Record<string, unknown>).columns)) {
        ((b.props as unknown as Record<string, unknown>).columns as Block[][]).forEach((col) => scan(col))
      }
    })
  }
  scan(blocks)

  if (imageCount > 3 && textLength < 200) {
    score += 2
    reasons.push('Zu viele Bilder im Verhältnis zum Text')
  }
  if (textLength < 50 && imageCount === 0) {
    score += 1
    reasons.push('Sehr wenig Inhalt')
  }

  return { score: Math.min(10, Math.round(score * 10) / 10), reasons }
}

// ─── Relative time ───────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tag(en)`
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

interface TopbarProps {
  templateName: string
  saveStatus: SaveStatus
  canUndo: boolean
  canRedo: boolean
  previewWidth: number
  showGlobalStyle: boolean
  isStarter: boolean
  templateType: string | null
  accessibilityIssues: AccessibilityIssue[]
  spamScore: number
  spamReasons: string[]
  showVersionHistory: boolean
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onPreviewWidthChange: (w: number) => void
  onToggleGlobalStyle: () => void
  onToggleVersionHistory: () => void
  onSave: () => void
  onPublish: () => void
  onSelectBlock: (id: string) => void
}

function EditorTopbar({
  templateName,
  saveStatus,
  canUndo,
  canRedo,
  previewWidth,
  showGlobalStyle,
  isStarter,
  templateType,
  accessibilityIssues,
  spamScore,
  spamReasons,
  showVersionHistory,
  onNameChange,
  onUndo,
  onRedo,
  onPreviewWidthChange,
  onToggleGlobalStyle,
  onToggleVersionHistory,
  onSave,
  onPublish,
}: TopbarProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [localName, setLocalName] = React.useState(templateName)
  const [showSpamPopover, setShowSpamPopover] = React.useState(false)
  const [showA11yPopover, setShowA11yPopover] = React.useState(false)

  React.useEffect(() => setLocalName(templateName), [templateName])

  const SaveIcon = saveStatus === 'saving' ? Loader2 : saveStatus === 'saved' ? Check : saveStatus === 'error' ? AlertCircle : Save
  const saveLabel = saveStatus === 'saving' ? 'Speichern…' : saveStatus === 'saved' ? 'Gespeichert' : saveStatus === 'error' ? 'Fehler' : 'Speichern'

  const channelCfg = templateType ? CHANNEL_CONFIG[templateType] : null

  // Spam color
  const spamColor = spamScore <= 3 ? 'text-green-600' : spamScore <= 6 ? 'text-yellow-600' : 'text-red-600'
  const spamBg = spamScore <= 3 ? 'bg-green-50' : spamScore <= 6 ? 'bg-yellow-50' : 'bg-red-50'

  // A11y color
  const a11yColor = accessibilityIssues.length === 0 ? 'text-green-600' : 'text-yellow-600'
  const a11yBg = accessibilityIssues.length === 0 ? 'bg-green-50' : 'bg-yellow-50'

  return (
    <div className="flex items-center gap-2 h-14 px-4 bg-white border-b border-gray-200 shrink-0 z-20 overflow-x-auto">
      <Link
        href="/admin/marketing/templates"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mr-1 shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:block">Vorlagen</span>
      </Link>

      <div className="w-px h-6 bg-gray-200 shrink-0" />

      {/* Template Name */}
      {editingName ? (
        <Input
          autoFocus
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => { setEditingName(false); if (localName.trim()) onNameChange(localName.trim()) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { setEditingName(false); if (localName.trim()) onNameChange(localName.trim()) }
            if (e.key === 'Escape') { setEditingName(false); setLocalName(templateName) }
          }}
          className="h-8 w-48 text-sm font-medium"
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-sm font-medium text-gray-800 hover:text-violet-600 hover:underline underline-offset-2 transition-colors max-w-[180px] truncate"
          title="Name bearbeiten"
        >
          {templateName || 'Vorlage ohne Name'}
        </button>
      )}

      {/* Channel Badge */}
      {channelCfg && (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0', channelCfg.color)}>
          <channelCfg.icon className="w-3 h-3" />
          {channelCfg.label}
        </span>
      )}

      <div className="flex-1" />

      <TooltipProvider delayDuration={0}>
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Undo/Redo */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={onUndo}><Undo2 className="w-4 h-4" /></Button>
          </TooltipTrigger><TooltipContent><p>Rückgängig (Ctrl+Z)</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={onRedo}><Redo2 className="w-4 h-4" /></Button>
          </TooltipTrigger><TooltipContent><p>Wiederholen (Ctrl+Y)</p></TooltipContent></Tooltip>

          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Preview Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => onPreviewWidthChange(600)} className={cn('flex items-center justify-center w-7 h-7 rounded-md transition-colors', previewWidth === 600 ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <Monitor className="w-4 h-4" />
              </button>
            </TooltipTrigger><TooltipContent><p>Desktop (600px)</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => onPreviewWidthChange(375)} className={cn('flex items-center justify-center w-7 h-7 rounded-md transition-colors', previewWidth === 375 ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <Smartphone className="w-4 h-4" />
              </button>
            </TooltipTrigger><TooltipContent><p>Mobil (375px)</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Accessibility Checker */}
          {templateType !== 'PUSH' && (
            <div className="relative">
              <Tooltip><TooltipTrigger asChild>
                <button
                  onClick={() => { setShowA11yPopover((v) => !v); setShowSpamPopover(false) }}
                  className={cn('flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium transition-colors', a11yBg, a11yColor, 'hover:opacity-90')}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {accessibilityIssues.length === 0 ? '✓' : accessibilityIssues.length}
                </button>
              </TooltipTrigger><TooltipContent><p>Zugänglichkeitsprüfung</p></TooltipContent></Tooltip>

              {showA11yPopover && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold">Zugänglichkeit</p>
                    <button onClick={() => setShowA11yPopover(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                  </div>
                  {accessibilityIssues.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 text-xs py-2">
                      <Check className="w-4 h-4" />
                      Keine Probleme gefunden
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {accessibilityIssues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
                          <span className="text-yellow-800">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Spam Score — email only */}
          {templateType === 'EMAIL' && (
            <div className="relative">
              <Tooltip><TooltipTrigger asChild>
                <button
                  onClick={() => { setShowSpamPopover((v) => !v); setShowA11yPopover(false) }}
                  className={cn('flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium transition-colors', spamBg, spamColor, 'hover:opacity-90')}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {spamScore.toFixed(1)}
                </button>
              </TooltipTrigger><TooltipContent><p>Spam-Score (grün ≤3, gelb ≤6, rot &gt;6)</p></TooltipContent></Tooltip>

              {showSpamPopover && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold">Spam-Score: {spamScore.toFixed(1)} / 10</p>
                    <button onClick={() => setShowSpamPopover(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
                    <div className={cn('h-2 rounded-full', spamScore <= 3 ? 'bg-green-500' : spamScore <= 6 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${spamScore * 10}%` }} />
                  </div>
                  {spamReasons.length === 0 ? (
                    <p className="text-xs text-green-600">Keine Spam-Faktoren erkannt ✓</p>
                  ) : (
                    <div className="space-y-1">
                      {spamReasons.map((r, i) => (
                        <p key={i} className="text-xs text-gray-600 flex gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />{r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Global Style */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant={showGlobalStyle ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={onToggleGlobalStyle}>
              <Palette className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent><p>Globale Stile</p></TooltipContent></Tooltip>

          {/* Version History */}
          {!isStarter && (
            <Tooltip><TooltipTrigger asChild>
              <Button variant={showVersionHistory ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={onToggleVersionHistory}>
                <History className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent><p>Versionshistorie</p></TooltipContent></Tooltip>
          )}

          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Save Button */}
          <Button
            size="sm"
            className={cn('h-8 gap-1.5 transition-colors', saveStatus === 'saved' && 'bg-green-600 hover:bg-green-700', saveStatus === 'error' && 'bg-red-600 hover:bg-red-700')}
            onClick={onSave}
            disabled={saveStatus === 'saving'}
          >
            <SaveIcon className={cn('w-3.5 h-3.5', saveStatus === 'saving' && 'animate-spin')} />
            {saveLabel}
          </Button>

          {/* Publish Button */}
          {!isStarter && templateType !== 'PUSH' && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-0.5" />
              <Button size="sm" className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={onPublish}>
                <Send className="w-3.5 h-3.5" />
                Veröffentlichen
              </Button>
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}

// ─── PUSH Settings Panel ──────────────────────────────────────────────────────

interface PushSettingsPanelProps {
  title: string
  body: string
  iconUrl: string
  imageUrl: string
  actionUrl: string
  isStarter: boolean
  onChange: (key: string, val: string) => void
  onSave: () => void
  saveStatus: SaveStatus
}

function PushSettingsPanel({ title, body, iconUrl, imageUrl, actionUrl, isStarter, onChange, onSave, saveStatus }: PushSettingsPanelProps) {
  return (
    <div className="flex-1 flex gap-6 p-8 overflow-y-auto">
      {/* Settings Form */}
      <div className="w-96 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Push-Einstellungen</h2>
          <p className="text-sm text-gray-500">Konfiguriere Titel, Nachrichtentext und Optionen für die Push-Notification.</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-600">Titel *</Label>
            <span className={cn('text-[10px]', title.length > 55 ? 'text-red-500' : 'text-gray-400')}>{title.length} / 65</span>
          </div>
          <Input value={title} onChange={(e) => onChange('pushTitle', e.target.value.slice(0, 65))} placeholder="Push-Titel" className="h-8 text-sm" disabled={isStarter} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-600">Nachrichtentext *</Label>
            <span className={cn('text-[10px]', body.length > 200 ? 'text-red-500' : 'text-gray-400')}>{body.length} / 240</span>
          </div>
          <Textarea value={body} onChange={(e) => onChange('pushBody', e.target.value.slice(0, 240))} placeholder="Nachrichtentext…" className="text-sm resize-none" rows={3} disabled={isStarter} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Icon-URL (optional)</Label>
          <Input value={iconUrl} onChange={(e) => onChange('pushIconUrl', e.target.value)} placeholder="https://…" className="h-8 text-sm" disabled={isStarter} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Bild-URL (Rich Push, optional)</Label>
          <Input value={imageUrl} onChange={(e) => onChange('pushImageUrl', e.target.value)} placeholder="https://…" className="h-8 text-sm" disabled={isStarter} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Action-URL / Deeplink</Label>
          <Input value={actionUrl} onChange={(e) => onChange('pushActionUrl', e.target.value)} placeholder="https://… oder app://…" className="h-8 text-sm" disabled={isStarter} />
        </div>

        {!isStarter && (
          <Button onClick={onSave} disabled={saveStatus === 'saving'} className="w-full gap-1.5">
            {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Push-Einstellungen speichern
          </Button>
        )}
      </div>

      {/* Live Preview */}
      <div className="flex-1 flex flex-col items-center gap-6 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vorschau</p>

        {/* iOS Preview */}
        <div className="w-80 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100">
            {iconUrl ? <img src={iconUrl} alt="Icon" className="w-5 h-5 rounded" /> : <div className="w-5 h-5 rounded bg-violet-200" />}
            <span className="text-xs font-medium text-gray-600">Kantine App</span>
            <span className="text-xs text-gray-400 ml-auto">Jetzt</span>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">{title || 'Push-Titel'}</p>
            <p className="text-xs text-gray-600 line-clamp-2">{body || 'Nachrichtentext der Push-Notification…'}</p>
          </div>
          {imageUrl && <img src={imageUrl} alt="" className="w-full object-cover max-h-32" />}
        </div>

        <p className="text-[10px] text-gray-400">iOS-Vorschau</p>
      </div>
    </div>
  )
}

// ─── Version History Panel ─────────────────────────────────────────────────────

interface VersionHistoryPanelProps {
  templateId: string
  versions: VersionEntry[]
  loadingVersions: boolean
  onClose: () => void
  onRestore: (versionId: string) => void
}

function VersionHistoryPanel({ versions, loadingVersions, onClose, onRestore }: VersionHistoryPanelProps) {
  return (
    <div className="absolute right-0 top-0 w-72 bg-white border-l border-gray-200 shadow-xl z-30 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-semibold">Versionshistorie</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingVersions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Noch keine Versionen gespeichert.</p>
            <p className="text-xs text-gray-400 mt-1">Beim nächsten Speichern wird eine Version angelegt.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {versions.map((v, i) => (
              <div key={v.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {i === 0 ? '⭐ Aktuell' : relativeTime(v.createdAt)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {v.savedBy === 'autosave' ? 'Automatisch gespeichert' : 'Manuell gespeichert'}
                      {i > 0 && ` · ${new Date(v.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  {i > 0 && (
                    <button
                      onClick={() => onRestore(v.id)}
                      className="flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-800 shrink-0 mt-0.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Wiederherstellen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t border-gray-100 shrink-0">
        <p className="text-[10px] text-gray-400 text-center">Max. 10 Versionen gespeichert</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params?.id as string

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [templateName, setTemplateName] = React.useState('Vorlage')
  const [isStarter, setIsStarter] = React.useState(false)
  const [templateType, setTemplateType] = React.useState<string | null>(null)

  // Email settings
  const [subjectLine, setSubjectLine] = React.useState('')
  const [preheaderText, setPreheaderText] = React.useState('')
  const [senderName, setSenderName] = React.useState('')
  const [testMailEmail, setTestMailEmail] = React.useState('')
  const [sendingTestMail, setSendingTestMail] = React.useState(false)

  // Push settings
  const [pushTitle, setPushTitle] = React.useState('')
  const [pushBody, setPushBody] = React.useState('')
  const [pushIconUrl, setPushIconUrl] = React.useState('')
  const [pushImageUrl, setPushImageUrl] = React.useState('')
  const [pushActionUrl, setPushActionUrl] = React.useState('')

  // Editor state
  const [blocks, setBlocksRaw] = React.useState<Block[]>([])
  const [globalStyle, setGlobalStyleRaw] = React.useState<GlobalStyle>(DEFAULT_GLOBAL_STYLE)
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null)
  const [showGlobalStyle, setShowGlobalStyle] = React.useState(false)
  const [previewWidth, setPreviewWidth] = React.useState<number>(600)

  // Version history
  const [showVersionHistory, setShowVersionHistory] = React.useState(false)
  const [versions, setVersions] = React.useState<VersionEntry[]>([])
  const [loadingVersions, setLoadingVersions] = React.useState(false)

  // History (undo/redo)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')
  const [publishOpen, setPublishOpen] = React.useState(false)
  const autosaveTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const isDirtyRef = React.useRef(false)

  // DnD
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeBlock, setActiveBlock] = React.useState<Block | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // ── Load Template ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!templateId) return
    fetch(`/api/admin/marketing/templates/${templateId}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null }; return r.json() })
      .then((data) => {
        if (!data) return
        setTemplateName(data.name || 'Vorlage')
        setIsStarter(data.isStarter || false)
        setTemplateType(data.type ?? null)
        setSubjectLine(data.subjectLine ?? '')
        setPreheaderText(data.preheaderText ?? '')
        setSenderName(data.senderName ?? '')

        const content: Partial<TemplateContent> =
          typeof data.content === 'object' && data.content ? data.content : {}

        // Handle PUSH content
        if (data.type === 'PUSH' && content && 'settings' in content) {
          const ps = (content as { settings: Record<string, string> }).settings
          setPushTitle(ps.title ?? '')
          setPushBody(ps.body ?? '')
          setPushIconUrl(ps.iconUrl ?? '')
          setPushImageUrl(ps.imageUrl ?? '')
          setPushActionUrl(ps.actionUrl ?? '')
        }

        const loadedBlocks: Block[] = Array.isArray(content.blocks)
          ? content.blocks.map((b) => ({
              ...b,
              mobileVisibility: b.mobileVisibility ?? 'both',
              padding: b.padding ?? { ...DEFAULT_PADDING },
            }))
          : []
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

  // ── History ─────────────────────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
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

  // ── Version History ─────────────────────────────────────────────────────────
  const loadVersions = React.useCallback(async () => {
    setLoadingVersions(true)
    try {
      const res = await fetch(`/api/admin/marketing/templates/${templateId}/versions`)
      if (res.ok) {
        const data = await res.json() as { versions: VersionEntry[] }
        setVersions(data.versions)
      }
    } catch { /* ignore */ }
    finally { setLoadingVersions(false) }
  }, [templateId])

  React.useEffect(() => {
    if (showVersionHistory) loadVersions()
  }, [showVersionHistory, loadVersions])

  const handleRestoreVersion = React.useCallback(async (versionId: string) => {
    if (!window.confirm('Möchtest du diese Version wirklich wiederherstellen? Nicht gespeicherte Änderungen gehen verloren.')) return
    try {
      const res = await fetch(`/api/admin/marketing/templates/${templateId}/versions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { restoredContent: TemplateContent }
      const restored = data.restoredContent
      const restoredBlocks = Array.isArray(restored.blocks) ? restored.blocks.map((b) => ({ ...b, mobileVisibility: b.mobileVisibility ?? 'both', padding: b.padding ?? { ...DEFAULT_PADDING } })) : []
      const restoredStyle = { ...DEFAULT_GLOBAL_STYLE, ...restored.globalStyle }
      setBlocksRaw(restoredBlocks)
      setGlobalStyleRaw(restoredStyle)
      pushHistory({ blocks: restoredBlocks, globalStyle: restoredStyle })
      toast.success('Version wiederhergestellt')
      setShowVersionHistory(false)
    } catch {
      toast.error('Wiederherstellen fehlgeschlagen')
    }
  }, [templateId, pushHistory])

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = React.useCallback(async (silent = false) => {
    if (isStarter) {
      toast.error('Starter-Vorlagen können nicht gespeichert werden. Bitte zuerst duplizieren.')
      return
    }
    setSaveStatus('saving')
    try {
      let content: TemplateContent | { type: string; settings: Record<string, string> }
      if (templateType === 'PUSH') {
        content = { type: 'push', settings: { title: pushTitle, body: pushBody, iconUrl: pushIconUrl, imageUrl: pushImageUrl, actionUrl: pushActionUrl } } as unknown as TemplateContent
      } else {
        content = { globalStyle, blocks }
      }

      const res = await fetch(`/api/admin/marketing/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          content,
          ...(templateType === 'EMAIL' && {
            subjectLine: subjectLine.trim() || null,
            preheaderText: preheaderText.trim() || null,
            senderName: senderName.trim() || null,
          }),
        }),
      })
      if (!res.ok) throw new Error('Save failed')

      // Save version snapshot on manual save
      if (!silent) {
        fetch(`/api/admin/marketing/templates/${templateId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, savedBy: 'manual' }),
        }).catch(() => {})
      }

      setSaveStatus('saved')
      isDirtyRef.current = false
      if (!silent) toast.success('Vorlage gespeichert')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      if (!silent) toast.error('Speichern fehlgeschlagen')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [blocks, globalStyle, templateId, templateName, isStarter, templateType, subjectLine, preheaderText, senderName, pushTitle, pushBody, pushIconUrl, pushImageUrl, pushActionUrl])

  // ── Autosave ────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    autosaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current && !isStarter) handleSave(true)
    }, AUTOSAVE_INTERVAL_MS)
    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current) }
  }, [handleSave, isStarter])

  // ── Block / GlobalStyle updates ─────────────────────────────────────────────
  const handleBlockChange = React.useCallback(
    (blockId: string, updates: Partial<Block>) => {
      setBlocks((prev) => updateBlockById(prev, blockId, updates))
    },
    [setBlocks]
  )

  const handleGlobalStyleChange = React.useCallback(
    (patch: Partial<GlobalStyle>) => { setGlobalStyle((prev) => ({ ...prev, ...patch })) },
    [setGlobalStyle]
  )

  const handlePushSettingChange = React.useCallback((key: string, val: string) => {
    if (key === 'pushTitle') { setPushTitle(val); isDirtyRef.current = true }
    else if (key === 'pushBody') { setPushBody(val); isDirtyRef.current = true }
    else if (key === 'pushIconUrl') { setPushIconUrl(val); isDirtyRef.current = true }
    else if (key === 'pushImageUrl') { setPushImageUrl(val); isDirtyRef.current = true }
    else if (key === 'pushActionUrl') { setPushActionUrl(val); isDirtyRef.current = true }
  }, [])

  // ── DnD handlers ────────────────────────────────────────────────────────────
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveId(id)

    if (event.active.data.current?.fromPalette) {
      const blockType = event.active.data.current.blockType as BlockType
      setActiveBlock({
        id: 'preview',
        type: blockType,
        props: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPS[blockType])),
        mobileVisibility: 'both',
        padding: { ...DEFAULT_PADDING },
      })
    } else {
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

    if (activeData?.fromPalette) {
      const blockType = activeData.blockType as BlockType
      const newBlock = createBlock(blockType)
      const overId = String(over.id)

      // Drop into a column zone (col-{parentId}-{colIdx})
      const colMatch = overId.match(/^col-([^-]+(?:-[^-]+)*)-(\d+)$/)
      if (colMatch) {
        const parentId = overId.slice(4, overId.lastIndexOf('-'))
        const colIdx = parseInt(overId.slice(overId.lastIndexOf('-') + 1))
        setBlocks((prev) => {
          const parent = findBlockById(prev, parentId)
          if (!parent) return [...prev, newBlock]
          const colProps = parent.props as ColumnsBlockProps
          const cols = Array.isArray(colProps.columns) ? colProps.columns : []
          const newCols = cols.map((col, i) => i === colIdx ? [...col, newBlock] : col)
          return updateBlockById(prev, parentId, { props: { ...colProps, columns: newCols } })
        })
        setSelectedBlockId(newBlock.id)
        setShowGlobalStyle(false)
        return
      }

      setBlocks((prev) => {
        if (overId === 'canvas' || overId === 'canvas-drop-zone') return [...prev, newBlock]
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

  const selectedBlock = selectedBlockId ? findBlockById(blocks, selectedBlockId) : null
  const isMobilePreview = previewWidth === 375
  const editorChannel = (templateType as EditorChannel) ?? 'EMAIL'

  // ── Accessibility & Spam ─────────────────────────────────────────────────────
  const accessibilityIssues = React.useMemo(() => checkAccessibility(blocks), [blocks])
  const { score: spamScore, reasons: spamReasons } = React.useMemo(
    () => computeSpamScore(blocks, subjectLine, preheaderText),
    [blocks, subjectLine, preheaderText]
  )

  // ── Test Mail ────────────────────────────────────────────────────────────────
  const handleSendTestMail = React.useCallback(async () => {
    if (!testMailEmail.trim() || !subjectLine.trim()) {
      toast.error('Bitte Betreff und Empfänger-E-Mail angeben.')
      return
    }
    setSendingTestMail(true)
    try {
      const res = await fetch('/api/admin/marketing/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, recipientEmail: testMailEmail.trim(), subjectLine: subjectLine.trim(), preheaderText: preheaderText.trim() || null, senderName: senderName.trim() || null }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Versand fehlgeschlagen')
      toast.success(`Test-Mail an ${testMailEmail} gesendet`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Senden')
    } finally {
      setSendingTestMail(false)
    }
  }, [testMailEmail, subjectLine, preheaderText, senderName, templateId])

  // ── Render states ────────────────────────────────────────────────────────────
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
        <Button variant="outline" onClick={() => router.push('/admin/marketing/templates')}>Zurück zur Übersicht</Button>
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
            size="sm" variant="outline"
            className="h-6 text-xs ml-2 border-amber-400 text-amber-700 hover:bg-amber-100"
            onClick={async () => {
              const res = await fetch(`/api/admin/marketing/templates/${templateId}/duplicate`, { method: 'POST' })
              if (res.ok) {
                const copy = await res.json() as { id: string }
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
        templateType={templateType}
        accessibilityIssues={accessibilityIssues}
        spamScore={spamScore}
        spamReasons={spamReasons}
        showVersionHistory={showVersionHistory}
        onNameChange={setTemplateName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreviewWidthChange={setPreviewWidth}
        onToggleGlobalStyle={() => { setShowGlobalStyle((v) => !v); if (!showGlobalStyle) setSelectedBlockId(null) }}
        onToggleVersionHistory={() => setShowVersionHistory((v) => !v)}
        onSave={() => handleSave(false)}
        onPublish={() => setPublishOpen(true)}
        onSelectBlock={setSelectedBlockId}
      />

      {/* PUSH: settings-only panel */}
      {templateType === 'PUSH' ? (
        <PushSettingsPanel
          title={pushTitle}
          body={pushBody}
          iconUrl={pushIconUrl}
          imageUrl={pushImageUrl}
          actionUrl={pushActionUrl}
          isStarter={isStarter}
          onChange={handlePushSettingChange}
          onSave={() => handleSave(false)}
          saveStatus={saveStatus}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left: Block Palette */}
            <BlockPalette channel={editorChannel} />

            {/* Center: Canvas */}
            <main className="flex-1 overflow-y-auto p-6">
              <EditorCanvas
                blocks={blocks}
                globalStyle={globalStyle}
                selectedBlockId={selectedBlockId}
                previewWidth={previewWidth}
                isMobilePreview={isMobilePreview}
                activeId={activeId}
                onBlocksChange={setBlocks}
                onUpdateBlock={handleBlockChange}
                onSelectBlock={(id) => {
                  setSelectedBlockId(id)
                  if (id !== null) setShowGlobalStyle(false)
                }}
              />
            </main>

            {/* Right: Properties Panel */}
            <div className="relative shrink-0">
              <PropertiesPanel
                selectedBlock={selectedBlock}
                globalStyle={globalStyle}
                showGlobalStyle={showGlobalStyle}
                onBlockChange={handleBlockChange}
                onGlobalStyleChange={handleGlobalStyleChange}
              />

              {/* Email Settings Panel */}
              {templateType === 'EMAIL' && !showGlobalStyle && (
                <div className="border-t border-gray-200 bg-white p-4 space-y-4 w-72">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    E-Mail-Einstellungen
                  </p>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Betreff *<span className="ml-1 text-gray-400">{subjectLine.length}/80</span></Label>
                    <Input value={subjectLine} onChange={(e) => setSubjectLine(e.target.value.slice(0, 80))} placeholder="Betreff der E-Mail" className="h-8 text-sm" disabled={isStarter} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Vorschau-Text<span className="ml-1 text-gray-400">{preheaderText.length}/150</span></Label>
                    <Textarea value={preheaderText} onChange={(e) => setPreheaderText(e.target.value.slice(0, 150))} placeholder="Kurzer Vorschautext…" className="text-sm resize-none" rows={2} disabled={isStarter} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Absender-Name</Label>
                    <Input value={senderName} onChange={(e) => setSenderName(e.target.value.slice(0, 100))} placeholder="z. B. Demo Kantine" className="h-8 text-sm" disabled={isStarter} />
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <Label className="text-xs text-gray-600">Test-Mail senden</Label>
                    <Input value={testMailEmail} onChange={(e) => setTestMailEmail(e.target.value)} placeholder="test@example.com" type="email" className="h-8 text-sm" />
                    <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 text-xs" onClick={handleSendTestMail} disabled={sendingTestMail || !testMailEmail.trim() || !subjectLine.trim()}>
                      <Send className="w-3.5 h-3.5" />
                      {sendingTestMail ? 'Wird gesendet…' : 'Test-Mail senden'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Version History Panel (overlays right panel) */}
              {showVersionHistory && (
                <VersionHistoryPanel
                  templateId={templateId}
                  versions={versions}
                  loadingVersions={loadingVersions}
                  onClose={() => setShowVersionHistory(false)}
                  onRestore={handleRestoreVersion}
                />
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeBlock ? (
              <div className="opacity-80 shadow-2xl rounded-lg overflow-hidden pointer-events-none max-w-xs rotate-1 scale-105">
                <BlockRendererSwitch block={activeBlock} globalStyle={globalStyle} isPreview />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Publish Dialog */}
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} templateId={templateId} templateName={templateName} />
    </div>
  )
}
