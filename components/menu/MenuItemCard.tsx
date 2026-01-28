'use client'

import { formatCurrency } from '@/lib/utils'
import { Utensils, Flame, Plus, Minus } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  date: string
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
    calories?: number | null
    dietTags?: string[]
    allergens?: string[]
  }
}

interface MenuItemCardProps {
  item: MenuItem
  onSelect?: (item: MenuItem, quantity: number) => void
  quantity?: number
  onQuantityChange?: (itemId: string, quantity: number) => void
}

export default function MenuItemCard({ 
  item, 
  onSelect, 
  quantity = 0,
  onQuantityChange 
}: MenuItemCardProps) {
  const isSoldOut = item.maxOrders !== null && item.currentOrders >= item.maxOrders
  const isAvailable = item.available && !isSoldOut
  const [localQuantity, setLocalQuantity] = useState(quantity)

  // Synchronisiere mit prop
  useEffect(() => {
    setLocalQuantity(quantity)
  }, [quantity])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return
    if (item.maxOrders && newQuantity > (item.maxOrders - item.currentOrders)) {
      newQuantity = item.maxOrders - item.currentOrders
    }
    setLocalQuantity(newQuantity)
    onQuantityChange?.(item.id, newQuantity)
  }

  const handleAdd = () => {
    if (!isAvailable) return
    const newQuantity = localQuantity + 1
    handleQuantityChange(newQuantity)
    if (onSelect && newQuantity === 1) {
      onSelect(item, newQuantity)
    }
  }

  const handleRemove = () => {
    const newQuantity = Math.max(0, localQuantity - 1)
    handleQuantityChange(newQuantity)
  }

  // Badge-Farben basierend auf dietTags
  const getBadgeColor = (tag: string) => {
    const tagLower = tag.toLowerCase()
    if (tagLower.includes('vegan') || tagLower.includes('vegetarisch')) {
      return 'bg-green-600 text-white'
    }
    if (tagLower.includes('fit') || tagLower.includes('vital')) {
      return 'bg-blue-500 text-white'
    }
    if (tagLower.includes('leicht') || tagLower.includes('light')) {
      return 'bg-emerald-500 text-white'
    }
    return 'bg-primary/10 text-primary'
  }

  const dietTags = (item.dish?.dietTags && Array.isArray(item.dish.dietTags)) ? item.dish.dietTags : []
  const hasVegan = dietTags.some(t => t && t.toLowerCase().includes('vegan'))
  const hasVegetarian = dietTags.some(t => t && t.toLowerCase().includes('vegetarisch'))

  return (
    <div
      className={`group relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 ${
        isAvailable
          ? 'hover:shadow-2xl hover:scale-[1.02] cursor-pointer'
          : 'opacity-60'
      }`}
    >
      {/* Bild-Bereich mit Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.dish.imageUrl ? (
          <img
            src={item.dish.imageUrl}
            alt={item.dish.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Utensils className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {item.dish.category && (
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">
              {item.dish.category.toUpperCase()}
            </span>
          )}
          {dietTags.some(t => t.toLowerCase().includes('fit') || t.toLowerCase().includes('vital')) && (
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg">
              FIT & VITAL
            </span>
          )}
        </div>

        {/* Anpassbar Badge (rechts oben) */}
        {isAvailable && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-md shadow-sm">
              Anpassbar
            </span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white px-4 py-2 rounded-lg font-bold text-gray-900">
              Ausverkauft
            </span>
          </div>
        )}
      </div>

      {/* Content-Bereich */}
      <div className="p-4 space-y-3">
        {/* Gerichtsname */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 leading-tight">
            {item.dish.name}
          </h3>
          {item.dish.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {item.dish.description}
            </p>
          )}
        </div>

        {/* Kalorien, Diät-Kategorien und Allergene in einer Zeile */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {item.dish.calories && (
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-foreground">{item.dish.calories} kcal</span>
            </div>
          )}
          
          {/* Diät-Kategorien */}
          {dietTags.length > 0 && (
            <>
              {item.dish.calories && <span className="text-muted-foreground">•</span>}
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasVegan && (
                  <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    Vegan
                  </span>
                )}
                {hasVegetarian && !hasVegan && (
                  <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    Vegetarisch
                  </span>
                )}
                {dietTags
                  .filter(t => t && !t.toLowerCase().includes('vegan') && !t.toLowerCase().includes('vegetarisch'))
                  .slice(0, 2)
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </>
          )}

          {/* Allergene */}
          {item.dish.allergens && Array.isArray(item.dish.allergens) && item.dish.allergens.length > 0 && (
            <>
              {(item.dish.calories || dietTags.length > 0) && <span className="text-muted-foreground">•</span>}
              <div className="flex items-center gap-1 flex-wrap">
                {item.dish.allergens.slice(0, 3).map((allergen, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full font-medium"
                  >
                    {allergen}
                  </span>
                ))}
                {item.dish.allergens.length > 3 && (
                  <span className="text-muted-foreground">
                    +{item.dish.allergens.length - 3}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Preis und Mengenauswahl */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(typeof item.price === 'string' ? parseFloat(item.price) : item.price)}
            </div>
            {item.maxOrders && !isSoldOut && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.maxOrders - item.currentOrders} verfügbar
              </div>
            )}
          </div>

          {/* Mengenauswahl */}
          {isAvailable && (
            <div className="flex items-center gap-3">
              {localQuantity > 0 ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md hover:scale-110 active:scale-95"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold text-foreground">{localQuantity}</div>
                    <div className="text-xs text-muted-foreground">in Deiner Box</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdd()
                    }}
                    disabled={item.maxOrders ? localQuantity >= (item.maxOrders - item.currentOrders) : false}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdd()
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
