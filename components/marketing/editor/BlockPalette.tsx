'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Type,
  AlignLeft,
  List,
  Image,
  Video,
  MousePointer2,
  Share2,
  Star,
  Code,
  Minus,
  Space,
  Columns2,
  Columns3,
  Ticket,
  Timer,
  Film,
  UtensilsCrossed,
  Mail,
  Phone,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { BlockType, EditorChannel } from './editor-types'
import { CHANNEL_BLOCK_ALLOWLIST } from './editor-types'
import { cn } from '@/lib/utils'

// ─── Palette Items ────────────────────────────────────────────────────────────

interface PaletteItem {
  type: BlockType
  label: string
  description: string
  icon: React.ElementType
  section: 'content' | 'layout' | 'interactive' | 'kantine'
}

const PALETTE_ITEMS: PaletteItem[] = [
  // ── Inhalt ──
  { type: 'headline', label: 'Überschrift', description: 'H1–H4 mit Styling', icon: Type, section: 'content' },
  { type: 'text', label: 'Fließtext', description: 'Rich-Text mit Merge-Tags', icon: AlignLeft, section: 'content' },
  { type: 'list', label: 'Liste', description: 'Aufzählung oder nummeriert', icon: List, section: 'content' },
  { type: 'image', label: 'Bild', description: 'Upload oder URL, klickbar', icon: Image, section: 'content' },
  { type: 'video', label: 'Video', description: 'YouTube / Vimeo Vorschau', icon: Video, section: 'content' },
  { type: 'gif', label: 'GIF / Sticker', description: 'Animiertes GIF per URL', icon: Film, section: 'content' },
  { type: 'button', label: 'Button / CTA', description: 'Klickbarer Call-to-Action', icon: MousePointer2, section: 'content' },
  { type: 'social', label: 'Social Media', description: 'Icon-Leiste für Netzwerke', icon: Share2, section: 'content' },
  { type: 'icon', label: 'Icon', description: 'Symbol mit optionalem Label', icon: Star, section: 'content' },
  { type: 'html', label: 'HTML-Block', description: 'Freies HTML & CSS', icon: Code, section: 'content' },
  // ── Layout ──
  { type: 'columns2', label: '2-Spalten', description: '50/50, 33/67, 67/33 …', icon: Columns2, section: 'layout' },
  { type: 'columns3', label: '3-Spalten', description: 'Drei Spalten-Layout', icon: Columns3, section: 'layout' },
  { type: 'divider', label: 'Trennlinie', description: 'Solid, gestrichelt, gepunktet', icon: Minus, section: 'layout' },
  { type: 'spacer', label: 'Spacer', description: 'Vertikaler Abstand', icon: Space, section: 'layout' },
  { type: 'countdown', label: 'Countdown-Timer', description: 'Laufender Countdown bis Datum', icon: Timer, section: 'layout' },
  // ── Interaktiv (In-App only) ──
  { type: 'emailCapture', label: 'E-Mail Eingabe', description: 'E-Mail-Adresse einsammeln', icon: Mail, section: 'interactive' },
  { type: 'phoneCapture', label: 'Telefon Eingabe', description: 'Telefonnummer einsammeln', icon: Phone, section: 'interactive' },
  // ── Kantine ──
  { type: 'tagesMenue', label: 'Tagesmenü', description: 'Heutiges Menü automatisch', icon: UtensilsCrossed, section: 'kantine' },
  { type: 'coupon', label: 'Coupon-Block', description: 'Coupon-Code einbetten', icon: Ticket, section: 'kantine' },
]

const SECTIONS: { key: PaletteItem['section']; label: string }[] = [
  { key: 'content', label: 'Inhalt' },
  { key: 'layout', label: 'Layout & Struktur' },
  { key: 'interactive', label: 'Interaktiv' },
  { key: 'kantine', label: 'Kantine' },
]

// ─── Draggable Item ───────────────────────────────────────────────────────────

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { fromPalette: true, blockType: item.type },
  })

  const Icon = item.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border/60 bg-background',
        'cursor-grab active:cursor-grabbing transition-all select-none',
        'hover:border-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-950/20',
        isDragging && 'opacity-40 shadow-lg scale-95'
      )}
    >
      <div className="p-1.5 rounded-md bg-muted/80 shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground leading-tight">{item.label}</p>
        <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{item.description}</p>
      </div>
    </div>
  )
}

// ─── Block Palette ────────────────────────────────────────────────────────────

export interface BlockPaletteProps {
  channel: EditorChannel
}

export function BlockPalette({ channel }: BlockPaletteProps) {
  const [search, setSearch] = React.useState('')

  const allowedTypes = CHANNEL_BLOCK_ALLOWLIST[channel]

  const filtered = PALETTE_ITEMS.filter((item) => {
    if (!allowedTypes.includes(item.type)) return false
    if (!search.trim()) return true
    return (
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    )
  })

  const visibleSections = SECTIONS.filter((s) =>
    filtered.some((i) => i.section === s.key)
  )

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-200 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blöcke</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Scrollable Block List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {visibleSections.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">Keine Blöcke gefunden</p>
        )}
        {visibleSections.map((section) => {
          const items = filtered.filter((i) => i.section === section.key)
          return (
            <div key={section.key}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <DraggablePaletteItem key={item.type} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Per Drag &amp; Drop in den Canvas ziehen
        </p>
      </div>
    </aside>
  )
}
