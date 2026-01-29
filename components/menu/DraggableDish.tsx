'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'

interface DraggableDishProps {
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }
}

export function DraggableDish({ dish }: DraggableDishProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `dish-${dish.id}`,
    data: {
      type: 'dish',
      dish,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-full min-w-0 justify-start text-left h-auto min-h-9 py-2 whitespace-normal"
        disabled={isDragging}
      >
        <span className="text-sm line-clamp-2 break-words block w-full min-w-0">{dish.name}</span>
      </Button>
    </div>
  )
}
