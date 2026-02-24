'use client'

import React from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import {
  GripVertical, Trash2, Copy, MousePointer, Monitor, Smartphone,
  ChevronUp, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Block, ColumnsBlockProps, GlobalStyle, generateId } from './editor-types'
import { BlockRendererSwitch } from './BlockRenderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditorCanvasProps {
  blocks: Block[]
  globalStyle: GlobalStyle
  selectedBlockId: string | null
  previewWidth: number
  isMobilePreview: boolean
  activeId: string | null
  onBlocksChange: (blocks: Block[]) => void
  onSelectBlock: (id: string | null) => void
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void
}

// ─── Drop Zone (empty state) ──────────────────────────────────────────────────

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed transition-all',
        isOver
          ? 'border-violet-500 bg-violet-50 scale-[1.01]'
          : 'border-gray-200 bg-gray-50/60 text-gray-400'
      )}
    >
      <MousePointer className="w-9 h-9 mb-3 opacity-40" />
      <p className="text-sm font-medium text-gray-500">Block hierher ziehen</p>
      <p className="text-xs mt-1 text-gray-400">oder Block aus der linken Palette auswählen</p>
    </div>
  )
}

// ─── Mobile Visibility Badge ──────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: Block['mobileVisibility'] }) {
  if (visibility === 'both') return null
  const isDesktop = visibility === 'desktop-only'
  return (
    <div className={cn(
      'absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium z-20 pointer-events-none',
      isDesktop ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
    )}>
      {isDesktop ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
      {isDesktop ? 'Nur Desktop' : 'Nur Mobil'}
    </div>
  )
}

// ─── Column Drop Zone ─────────────────────────────────────────────────────────

interface ColumnDropZoneProps {
  colId: string
  flex: number
  colBlocks: Block[]
  globalStyle: GlobalStyle
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onUpdateColBlocks: (newBlocks: Block[]) => void
}

function ColumnDropZone({
  colId, flex, colBlocks, globalStyle, selectedBlockId, onSelectBlock, onUpdateColBlocks,
}: ColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: colId })

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    const next = [...colBlocks]
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= next.length) return
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    onUpdateColBlocks(next)
  }

  const duplicateBlock = (idx: number) => {
    const copy: Block = {
      ...colBlocks[idx],
      id: generateId(),
      props: JSON.parse(JSON.stringify(colBlocks[idx].props)),
    }
    const next = [...colBlocks]
    next.splice(idx + 1, 0, copy)
    onUpdateColBlocks(next)
  }

  const deleteBlock = (idx: number) => {
    if (selectedBlockId === colBlocks[idx].id) onSelectBlock(null)
    onUpdateColBlocks(colBlocks.filter((_, i) => i !== idx))
  }

  return (
    <div
      ref={setNodeRef}
      style={{ flex }}
      className={cn(
        'min-h-[60px] rounded-lg transition-all',
        isOver && 'ring-2 ring-violet-400 ring-inset bg-violet-50/30'
      )}
    >
      {colBlocks.length === 0 ? (
        <div className={cn(
          'h-14 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors',
          isOver ? 'border-violet-400 bg-violet-50' : 'border-gray-200'
        )}>
          <p className="text-xs text-gray-300 pointer-events-none select-none">Block hier ablegen</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {colBlocks.map((b, idx) => {
            const isSelected = selectedBlockId === b.id
            return (
              <div
                key={b.id}
                className={cn(
                  'group/colblock relative cursor-pointer rounded transition-all',
                  isSelected
                    ? 'ring-2 ring-violet-500 ring-offset-1'
                    : 'hover:ring-2 hover:ring-violet-300 hover:ring-offset-1'
                )}
                onClick={(e) => { e.stopPropagation(); onSelectBlock(b.id) }}
              >
                {/* Mini Toolbar */}
                <div className={cn(
                  'absolute right-0 top-0 -translate-y-full flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-0.5 py-0.5 z-20',
                  'opacity-0 group-hover/colblock:opacity-100 transition-opacity pointer-events-none group-hover/colblock:pointer-events-auto',
                  isSelected && 'opacity-100 pointer-events-auto'
                )}>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up') }}
                    disabled={idx === 0}
                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Nach oben"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down') }}
                    disabled={idx === colBlocks.length - 1}
                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Nach unten"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="w-px h-3.5 bg-gray-100" />
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateBlock(idx) }}
                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    title="Duplizieren"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <div className="w-px h-3.5 bg-gray-100" />
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBlock(idx) }}
                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    title="Löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <BlockRendererSwitch block={b} globalStyle={globalStyle} />
              </div>
            )
          })}
          {isOver && <div className="h-0.5 bg-violet-500 rounded-full animate-pulse" />}
        </div>
      )}
    </div>
  )
}

// ─── Inline Columns Editor ────────────────────────────────────────────────────

interface InlineColumnsEditorProps {
  block: Block
  globalStyle: GlobalStyle
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void
}

function InlineColumnsEditor({ block, globalStyle, selectedBlockId, onSelectBlock, onUpdateBlock }: InlineColumnsEditorProps) {
  const colProps = block.props as ColumnsBlockProps
  const ratioMap: Record<string, number[]> = {
    '50/50': [50, 50],
    '33/67': [33, 67],
    '67/33': [67, 33],
    '25/75': [25, 75],
    '75/25': [75, 25],
  }
  const ratios = ratioMap[colProps.ratio] ?? [50, 50]
  const numCols = block.type === 'columns3' ? 3 : 2
  const cols: Block[][] = Array.isArray(colProps.columns) && colProps.columns.length === numCols
    ? colProps.columns
    : Array.from({ length: numCols }, () => [])

  const updateCol = (colIdx: number, newColBlocks: Block[]) => {
    const newCols = cols.map((c, i) => i === colIdx ? newColBlocks : c)
    onUpdateBlock(block.id, { props: { ...colProps, columns: newCols } as ColumnsBlockProps })
  }

  return (
    <div style={{ display: 'flex', gap: `${colProps.gap ?? 16}px` }}>
      {cols.map((colBlocks, colIdx) => (
        <ColumnDropZone
          key={colIdx}
          colId={`col-${block.id}-${colIdx}`}
          flex={ratios[colIdx] ?? 50}
          colBlocks={colBlocks}
          globalStyle={globalStyle}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          onUpdateColBlocks={(newBlocks) => updateCol(colIdx, newBlocks)}
        />
      ))}
    </div>
  )
}

// ─── Sortable Block Wrapper ───────────────────────────────────────────────────

interface SortableBlockProps {
  block: Block
  isSelected: boolean
  globalStyle: GlobalStyle
  isMobilePreview: boolean
  selectedBlockId: string | null
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void
  onSelectBlock: (id: string | null) => void
}

function SortableBlock({
  block,
  isSelected,
  globalStyle,
  isMobilePreview,
  selectedBlockId,
  onSelect,
  onDuplicate,
  onDelete,
  onUpdateBlock,
  onSelectBlock,
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

  const isHiddenInCurrentMode =
    (isMobilePreview && block.mobileVisibility === 'desktop-only') ||
    (!isMobilePreview && block.mobileVisibility === 'mobile-only')

  const isColumns = block.type === 'columns2' || block.type === 'columns3'

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
          : 'hover:ring-2 hover:ring-violet-300 hover:ring-offset-1',
        isHiddenInCurrentMode && 'opacity-30 pointer-events-none'
      )}
    >
      {/* Mobile visibility badge */}
      {block.mobileVisibility !== 'both' && <VisibilityBadge visibility={block.mobileVisibility} />}

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
          'absolute right-0 top-0 -translate-y-full flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10',
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
        <div className="w-px h-4 bg-gray-100" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Löschen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Content */}
      {isColumns ? (
        <InlineColumnsEditor
          block={block}
          globalStyle={globalStyle}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          onUpdateBlock={onUpdateBlock}
        />
      ) : (
        <BlockRendererSwitch block={block} globalStyle={globalStyle} />
      )}
    </div>
  )
}

// ─── Editor Canvas ────────────────────────────────────────────────────────────

export function EditorCanvas({
  blocks,
  globalStyle,
  selectedBlockId,
  previewWidth,
  isMobilePreview,
  activeId,
  onBlocksChange,
  onSelectBlock,
  onUpdateBlock,
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

  const isPaletteItemDragging = activeId !== null && activeId.startsWith('palette-')

  return (
    <div
      ref={setCanvasRef}
      className={cn(
        'min-h-full p-8 transition-colors',
        isCanvasOver && blocks.length > 0 && 'ring-2 ring-violet-400 ring-inset',
        isPaletteItemDragging && blocks.length === 0 && 'ring-2 ring-violet-400 ring-inset'
      )}
      style={{ backgroundColor: globalStyle.bgColor }}
      onClick={() => onSelectBlock(null)}
    >
      <div
        className="mx-auto transition-all duration-300 rounded-lg overflow-hidden"
        style={{
          maxWidth: previewWidth,
          backgroundColor: globalStyle.contentBgColor,
          padding: globalStyle.padding,
          fontFamily: globalStyle.fontFamily,
        }}
      >
        {blocks.length === 0 ? (
          <DropZone />
        ) : (
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1 pl-8">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  globalStyle={globalStyle}
                  isMobilePreview={isMobilePreview}
                  selectedBlockId={selectedBlockId}
                  onSelect={() => onSelectBlock(block.id)}
                  onDuplicate={() => handleDuplicate(block.id)}
                  onDelete={() => handleDelete(block.id)}
                  onUpdateBlock={onUpdateBlock}
                  onSelectBlock={onSelectBlock}
                />
              ))}
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
