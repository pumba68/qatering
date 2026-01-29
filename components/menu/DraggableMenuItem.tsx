'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X, Sparkles } from 'lucide-react'

export interface MenuItemForPlanner {
  id: string
  dishId: string
  date: string
  price: string
  maxOrders: number | null
  available: boolean
  isPromotion?: boolean
  promotionPrice?: string | number | null
  promotionLabel?: string | null
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }
}

export interface PromotionUpdatePayload {
  isPromotion: boolean
  promotionPrice: number | null
  promotionLabel: string | null
}

interface DraggableMenuItemProps {
  item: MenuItemForPlanner
  onRemove: (itemId: string) => void
  onPriceUpdate: (itemId: string, price: number) => void
  onPromotionUpdate?: (itemId: string, payload: PromotionUpdatePayload) => void
}

function parsePrice(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) && n > 0 ? n : null
}

export function DraggableMenuItem({
  item,
  onRemove,
  onPriceUpdate,
  onPromotionUpdate,
}: DraggableMenuItemProps) {
  const [promoOpen, setPromoOpen] = useState(false)
  const isPromotion = item.isPromotion === true
  const promotionPrice = parsePrice(item.promotionPrice)
  const promotionLabel = item.promotionLabel ?? ''

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

  const hasPromoLabel = isPromotion && promotionLabel.trim().length > 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="flex-1 min-w-0">
            {isPromotion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-xs font-bold shadow-sm mb-1">
                Aktion
              </span>
            )}
            <p className="font-medium text-sm line-clamp-2">{item.dish.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            type="number"
            step="0.1"
            value={parseFloat(String(item.price))}
            onChange={(e) => {
              e.stopPropagation()
              onPriceUpdate(item.id, parseFloat(e.target.value))
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-20 h-8 text-sm rounded-lg"
          />
          <span className="text-xs text-muted-foreground">€</span>
          {onPromotionUpdate && (
            <DropdownMenu open={promoOpen} onOpenChange={setPromoOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isPromotion ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 rounded-lg shrink-0 ${
                    isPromotion
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-0'
                      : 'border-border/60'
                  }`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Aktion
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-4 rounded-xl border-border/50 shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <PromotionForm
                  isPromotion={isPromotion}
                  promotionPrice={promotionPrice}
                  promotionLabel={promotionLabel}
                  onSave={(payload) => {
                    onPromotionUpdate(item.id, payload)
                    setPromoOpen(false)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {hasPromoLabel && (
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2 line-clamp-2">
            {promotionLabel}
          </p>
        )}
        {item.dish.dietTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {item.dish.dietTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PromotionFormProps {
  isPromotion: boolean
  promotionPrice: number | null
  promotionLabel: string
  onSave: (payload: PromotionUpdatePayload) => void
  onPointerDown: (e: React.PointerEvent) => void
}

function PromotionForm({
  isPromotion: initialPromotion,
  promotionPrice: initialPrice,
  promotionLabel: initialLabel,
  onSave,
  onPointerDown,
}: PromotionFormProps) {
  const [isPromotion, setIsPromotion] = useState(initialPromotion)
  const [promotionPrice, setPromotionPrice] = useState(
    initialPrice != null ? String(initialPrice) : ''
  )
  const [promotionLabel, setPromotionLabel] = useState(initialLabel)

  const handleSave = () => {
    const priceNum =
      promotionPrice.trim() === ''
        ? null
        : parseFloat(promotionPrice)
    const price = priceNum != null && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null
    onSave({
      isPromotion,
      promotionPrice: price,
      promotionLabel: promotionLabel.trim() || null,
    })
  }

  return (
    <div className="space-y-4" onPointerDown={onPointerDown}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="promo-check"
          checked={isPromotion}
          onChange={(e) => setIsPromotion(e.target.checked)}
          className="rounded border-border h-4 w-4"
        />
        <Label htmlFor="promo-check" className="text-sm font-medium cursor-pointer">
          Als Aktion bewerben
        </Label>
      </div>
      {isPromotion && (
        <>
          <div className="space-y-2">
            <Label htmlFor="promo-price" className="text-sm text-muted-foreground">
              Sonderpreis (€) – optional
            </Label>
            <Input
              id="promo-price"
              type="number"
              step="0.1"
              min="0"
              placeholder="z.B. 5,90"
              value={promotionPrice}
              onChange={(e) => setPromotionPrice(e.target.value)}
              className="rounded-lg h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-label" className="text-sm text-muted-foreground">
              Angebotstext – optional
            </Label>
            <Input
              id="promo-label"
              type="text"
              placeholder="z.B. gratis Nachtisch dazu"
              maxLength={200}
              value={promotionLabel}
              onChange={(e) => setPromotionLabel(e.target.value)}
              className="rounded-lg h-9"
            />
          </div>
        </>
      )}
      <Button
        size="sm"
        className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
        onClick={handleSave}
      >
        Speichern
      </Button>
    </div>
  )
}
