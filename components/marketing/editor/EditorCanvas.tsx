'use client'

import React from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { GripVertical, Trash2, Copy, MousePointer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Block, GlobalStyle, generateId } from './editor-types'
import { BlockRendererSwitch } from './BlockRenderer'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EditorCanvasProps {
  blocks: Block[]
  globalStyle: GlobalStyle
  selectedBlockId: string | null
  previewWidth: number
  /** ID of the currently dragged item (from the parent DndContext) */
  activeId: string | null
  onBlocksChange: (blocks: Block[]) => void
  onSelectBlock: (id: string | null) => void
}

// ─── Drop Zone (empty state) ──────────────────────────────────────────────────

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-colors',
        isOver
          ? 'border-violet-500 bg-violet-50'
          : 'border-gray-300 bg-gray-50 text-gray-400'
      )}
    >
      <MousePointer className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm font-medium">Block hierher ziehen</p>
      <p className="text-xs mt-1 opacity-70">oder einen Block aus der linken Palette wählen</p>
    </div>
  )
}

// ─── Sortable Block Wrapper ───────────────────────────────────────────────────

interface SortableBlockProps {
  block: Block
  isSelected: boolean
  globalStyle: GlobalStyle
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function SortableBlock({
  block,
  isSelected,
  globalStyle,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { fromCanvas: true } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        'group relative rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'ring-2 ring-violet-500 ring-offset-2'
          : 'hover:ring-2 hover:ring-violet-300 hover:ring-offset-1'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 flex items-center justify-center w-6 h-6',
          'rounded cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
        aria-label="Block verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Block Toolbar */}
      <div
        className={cn(
          'absolute right-0 top-0 -translate-y-full flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title="Duplizieren"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
          title="Löschen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Content */}
      <BlockRendererSwitch block={block} globalStyle={globalStyle} />
    </div>
  )
}

// ─── Editor Canvas ────────────────────────────────────────────────────────────
// NOTE: DndContext lives in the editor page so that BlockPalette (a sibling)
// shares the same context. This component only handles SortableContext + drop.

export function EditorCanvas({
  blocks,
  globalStyle,
  selectedBlockId,
  previewWidth,
  activeId,
  onBlocksChange,
  onSelectBlock,
}: EditorCanvasProps) {
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({ id: 'canvas' })

  const blockIds = blocks.map((b) => b.id)

  const handleDuplicate = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId)
    if (idx === -1) return
    const copy: Block = {
      ...blocks[idx],
      id: generateId(),
      props: JSON.parse(JSON.stringify(blocks[idx].props)),
    }
    const next = [...blocks]
    next.splice(idx + 1, 0, copy)
    onBlocksChange(next)
  }

  const handleDelete = (blockId: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== blockId))
    if (selectedBlockId === blockId) onSelectBlock(null)
  }

  // Is an item from the palette currently being dragged over us?
  const isPaletteItemDragging = activeId !== null && activeId.startsWith('palette-')

  return (
    <div
      ref={setCanvasRef}
      className={cn(
        'min-h-full rounded-xl p-8 transition-colors',
        isCanvasOver && blocks.length > 0 && 'ring-2 ring-violet-400 ring-inset',
        isPaletteItemDragging && blocks.length === 0 && 'ring-2 ring-violet-400 ring-inset'
      )}
      style={{ backgroundColor: globalStyle.bgColor }}
      onClick={() => onSelectBlock(null)}
    >
      <div
        className="mx-auto transition-all duration-300"
        style={{ maxWidth: previewWidth, padding: globalStyle.padding }}
      >
        {blocks.length === 0 ? (
          <DropZone />
        ) : (
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pl-8">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  globalStyle={globalStyle}
                  onSelect={() => onSelectBlock(block.id)}
                  onDuplicate={() => handleDuplicate(block.id)}
                  onDelete={() => handleDelete(block.id)}
                />
              ))}
              {/* Drop indicator at end when dragging a palette item */}
              {isPaletteItemDragging && isCanvasOver && (
                <div className="h-1 bg-violet-500 rounded-full mx-2 animate-pulse" />
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
