'use client'

import { useDraggable } from '@dnd-kit/core'
import {
  Type,
  AlignLeft,
  Image,
  MousePointer2,
  Minus,
  Space,
  Columns2,
  Columns3,
  Ticket,
} from 'lucide-react'
import type { BlockType } from './editor-types'

interface PaletteItem {
  type: BlockType
  label: string
  description: string
  icon: React.ElementType
  section: 'content' | 'layout' | 'action'
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'headline', label: 'Headline', description: 'Überschrift H1–H3', icon: Type, section: 'content' },
  { type: 'text', label: 'Text', description: 'Formatierbarer Fließtext', icon: AlignLeft, section: 'content' },
  { type: 'image', label: 'Bild', description: 'Bild hochladen oder URL', icon: Image, section: 'content' },
  { type: 'button', label: 'Button / CTA', description: 'Klickbarer Call-to-Action', icon: MousePointer2, section: 'content' },
  { type: 'columns2', label: '2-Spalten', description: 'Zwei gleichbreite Spalten', icon: Columns2, section: 'layout' },
  { type: 'columns3', label: '3-Spalten', description: 'Drei gleichbreite Spalten', icon: Columns3, section: 'layout' },
  { type: 'divider', label: 'Trennlinie', description: 'Horizontale Linie', icon: Minus, section: 'layout' },
  { type: 'spacer', label: 'Spacer', description: 'Vertikaler Abstand', icon: Space, section: 'layout' },
  { type: 'coupon', label: 'Coupon-Block', description: 'Coupon-Code einbetten', icon: Ticket, section: 'action' },
]

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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-background cursor-grab active:cursor-grabbing transition-all hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 select-none ${
        isDragging ? 'opacity-50 shadow-lg scale-95' : ''
      }`}
    >
      <div className="p-1.5 rounded-md bg-muted shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{item.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
      </div>
    </div>
  )
}

export function BlockPalette() {
  const sections = [
    { key: 'content' as const, label: 'Inhalt' },
    { key: 'layout' as const, label: 'Layout' },
    { key: 'action' as const, label: 'Aktionen' },
  ]

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
      <div className="px-3 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blöcke</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 space-y-4 px-2">
        {sections.map((section) => {
          const items = PALETTE_ITEMS.filter((i) => i.section === section.key)
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
      <div className="px-3 py-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 text-center">
          Block per Drag &amp; Drop in die Canvas ziehen
        </p>
      </div>
    </aside>
  )
}
