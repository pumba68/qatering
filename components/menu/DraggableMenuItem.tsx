'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DraggableMenuItemProps {
  item: {
    id: string
    dishId: string
    date: string
    price: string
    maxOrders: number | null
    available: boolean
    dish: {
      id: string
      name: string
      description: string | null
      imageUrl: string | null
      dietTags: string[]
    }
  }
  onRemove: (itemId: string) => void
  onPriceUpdate: (itemId: string, price: number) => void
}

export function DraggableMenuItem({
  item,
  onRemove,
  onPriceUpdate,
}: DraggableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'menuItem',
      item,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-border/50"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2 gap-2">
          <p className="font-medium text-sm flex-1 line-clamp-2">{item.dish.name}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="number"
            step="0.1"
            value={parseFloat(item.price)}
            onChange={(e) => {
              e.stopPropagation()
              onPriceUpdate(item.id, parseFloat(e.target.value))
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-20 h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground">€</span>
        </div>
        {item.dish.dietTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {item.dish.dietTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
