'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { formatDayName, formatShortDate } from '@/lib/week-utils'
import { DraggableMenuItem } from './DraggableMenuItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface MenuItem {
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

interface DroppableDayCardProps {
  day: Date
  dayKey: string
  items: MenuItem[]
  onRemoveItem: (itemId: string) => void
  onUpdatePrice: (itemId: string, price: number) => void
  onAddDishClick: () => void
  showDishSelector: boolean
  dishes?: Array<{
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }>
  onDishSelect?: (dishId: string, day: Date) => void
  draggedDishId?: string | null
  isDragOver?: boolean
  /** Wenn true: Button „Hier einfügen“ anzeigen (Sheet offen, Gericht gewählt, Tag auswählen). */
  insertDishMode?: boolean
  /** Klick auf „Hier einfügen“ – Gericht in diesen Tag einfügen. */
  onInsertDishClick?: () => void
}

export function DroppableDayCard({
  day,
  dayKey,
  items,
  onRemoveItem,
  onUpdatePrice,
  onAddDishClick,
  showDishSelector,
  dishes,
  onDishSelect,
  draggedDishId,
  isDragOver,
  insertDishMode,
  onInsertDishClick,
}: DroppableDayCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayKey}`,
    data: {
      type: 'day',
      dayKey,
      day,
    },
  })

  const itemIds = items.map((item) => item.id)
  
  const dishAlreadyExists = draggedDishId
    ? items.some(item => item.dishId === draggedDishId)
    : false
  
  const getCardStyles = () => {
    if (!isOver && !isDragOver) {
      return 'border-border/50'
    }
    if (dishAlreadyExists) {
      return 'bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-700'
    }
    return 'bg-primary/5 dark:bg-primary/10 border-2 border-primary/40 dark:border-primary/50'
  }

  const cardStyles = getCardStyles()
  const isDropTarget = isOver || isDragOver

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-[400px] transition-all duration-200 ${cardStyles}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{formatDayName(day)}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatShortDate(day)}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={`min-h-[220px] rounded-xl border-2 border-dashed transition-all duration-200 p-2 space-y-2 ${
            isDropTarget && !dishAlreadyExists
              ? 'border-primary/50 bg-primary/10 dark:bg-primary/15'
              : dishAlreadyExists
                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                : 'border-border/60 bg-muted/20 dark:bg-muted/30'
          }`}
        >
          {items.length > 0 ? (
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <DraggableMenuItem
                  key={item.id}
                  item={item}
                  onRemove={onRemoveItem}
                  onPriceUpdate={onUpdatePrice}
                />
              ))}
            </SortableContext>
          ) : (
            <div className="h-full min-h-[180px] flex items-center justify-center rounded-lg">
              <p
                className={`text-sm text-center px-2 ${
                  dishAlreadyExists
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : isDropTarget
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                }`}
              >
                {dishAlreadyExists
                  ? 'Gericht bereits vorhanden!'
                  : isDropTarget
                    ? 'Hier ablegen'
                    : 'Gericht hierher ziehen'}
              </p>
            </div>
          )}
          {items.length > 0 && isDropTarget && !dishAlreadyExists && (
            <p className="text-xs text-center text-primary font-medium pt-1">
              Hier ablegen
            </p>
          )}
        </div>

        {insertDishMode && onInsertDishClick && (
          <Button
            onClick={onInsertDishClick}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Hier einfügen
          </Button>
        )}

        <Button
          onClick={onAddDishClick}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Gericht hinzufügen
        </Button>

        {showDishSelector && dishes && dishes.length > 0 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border max-h-[240px] overflow-y-auto">
            <div className="space-y-1">
              {dishes.map((dish) => (
                <Button
                  key={dish.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onDishSelect) {
                      onDishSelect(dish.id, day)
                    }
                  }}
                >
                  {dish.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
