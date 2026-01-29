'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface DashboardSortableWidgetProps {
  id: string
  children: React.ReactNode
}

export function DashboardSortableWidget({ id, children }: DashboardSortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'dashboard-widget', widgetId: id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-2xl border border-transparent hover:border-border/50 transition-colors"
    >
      {/* Drag-Handle: nur hier startet der Drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        title="Zum Anordnen ziehen"
        aria-label="Widget verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  )
}
