'use client'

import { formatCurrency } from '@/lib/utils'

interface MenuItem {
  id: string
  price: number
  available: boolean
  currentOrders: number
  maxOrders: number | null
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
  }
}

interface MenuItemCardProps {
  item: MenuItem
  onSelect?: () => void
}

export default function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const isSoldOut = item.maxOrders !== null && item.currentOrders >= item.maxOrders
  const isAvailable = item.available && !isSoldOut

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 ${
        isAvailable
          ? 'border-border hover:border-primary hover:shadow-md cursor-pointer bg-card hover:scale-[1.02]'
          : 'border-border/50 bg-muted opacity-60'
      }`}
      onClick={isAvailable ? onSelect : undefined}
    >
      {item.dish.imageUrl && (
        <img
          src={item.dish.imageUrl}
          alt={item.dish.name}
          className="w-full h-32 object-cover rounded mb-3"
        />
      )}
      <h4 className="font-semibold text-foreground mb-1">{item.dish.name}</h4>
      {item.dish.description && (
        <p className="text-sm text-muted-foreground mb-2">{item.dish.description}</p>
      )}
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-primary">
          {formatCurrency(item.price)}
        </span>
        {isSoldOut && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
            Ausverkauft
          </span>
        )}
        {!isSoldOut && item.maxOrders && (
          <span className="text-xs text-muted-foreground">
            {item.maxOrders - item.currentOrders} verfügbar
          </span>
        )}
      </div>
      {item.dish.category && (
        <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
          {item.dish.category}
        </span>
      )}
    </div>
  )
}
