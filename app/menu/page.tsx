'use client'

import { useState, useEffect, useCallback } from 'react'
import MenuWeek from '@/components/menu/MenuWeek'
import CartSidebar from '@/components/order/CartSidebar'
import { MarketingSlotArea } from '@/components/marketing/MarketingSlotArea'
import { MarketingBannerArea } from '@/components/marketing/MarketingBannerArea'
import { Button } from '@/components/ui/button'
import { ShoppingCart, MapPin, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const MENU_LOCATION_STORAGE_KEY = 'menu-selected-location-id'

interface LocationOption {
  id: string
  name: string
}

interface CartItem {
  menuItemId: string
  quantity: number
  dishName: string
  price: number
}

/** Preis pro Einheit für Warenkorb & Abrechnung: Aktion = promotionPrice, sonst Normalpreis. */
function getEffectivePrice(item: { price: number | string; isPromotion?: boolean; promotionPrice?: number | string | null }): number {
  if (item.isPromotion && item.promotionPrice != null && item.promotionPrice !== '') {
    const p = typeof item.promotionPrice === 'string' ? parseFloat(item.promotionPrice) : item.promotionPrice
    if (Number.isFinite(p) && p >= 0) return p
  }
  return typeof item.price === 'string' ? parseFloat(item.price) : item.price
}

export default function MenuPage() {
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const setSelectedLocationId = useCallback((id: string) => {
    setSelectedLocationIdState(id)
    try {
      localStorage.setItem(MENU_LOCATION_STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/locations')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) {
          setLocations(data)
          const stored = localStorage.getItem(MENU_LOCATION_STORAGE_KEY)
          const firstId = data[0]?.id
          if (stored && data.some((l: LocationOption) => l.id === stored)) {
            setSelectedLocationIdState(stored)
          } else if (firstId) {
            setSelectedLocationIdState(firstId)
            try {
              localStorage.setItem(MENU_LOCATION_STORAGE_KEY, firstId)
            } catch {
              // ignore
            }
          }
        }
      } catch (e) {
        if (!cancelled) setLocations([])
      } finally {
        if (!cancelled) setLocationsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const locationId = selectedLocationId ?? (locations[0]?.id ?? '')
  const selectedLocationName = locations.find((l) => l.id === locationId)?.name ?? 'Standort'

  const handleSelectItem = (item: any, quantity: number = 1) => {
    const existingItem = cart.find((i) => i.menuItemId === item.id)
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity <= 0) {
        handleRemoveItem(item.id)
      } else {
        setCart(
          cart.map((i) =>
            i.menuItemId === item.id
              ? { ...i, quantity: newQuantity }
              : i
          )
        )
      }
    } else if (quantity > 0) {
      const effectivePrice = getEffectivePrice(item)
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          quantity: quantity,
          dishName: item.dish.name,
          price: effectivePrice,
        },
      ])
    }
  }

  const handleQuantityChange = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId)
    } else {
      setCart(
        cart.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        )
      )
    }
  }

  const handleRemoveItem = (menuItemId: string) => {
    setCart(cart.filter((i) => i.menuItemId !== menuItemId))
  }

  const handleLocationChange = (newLocationId: string) => {
    if (newLocationId === locationId) return
    setSelectedLocationId(newLocationId)
    setCart([])
    setCartOpen(false)
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  if (locationsLoading && locations.length === 0) {
    return (
      <div className="min-h-screen menu-page-pattern bg-gradient-to-br from-background/95 via-background/90 to-green-50/40 dark:to-green-950/15 flex items-center justify-center">
        <p className="text-muted-foreground">Speiseplan wird geladen…</p>
      </div>
    )
  }

  if (!locationId) {
    return (
      <div className="min-h-screen menu-page-pattern bg-gradient-to-br from-background/95 via-background/90 to-green-50/40 dark:to-green-950/15 flex items-center justify-center">
        <p className="text-muted-foreground">Kein Standort verfügbar. Bitte später erneut versuchen.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen menu-page-pattern bg-gradient-to-br from-background/95 via-background/90 to-green-50/40 dark:to-green-950/15">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Marketing: Slot menu_top + Banner für Menü-Seite */}
        <div className="space-y-4 mb-6">
          <MarketingSlotArea slotId="menu_top" />
          <MarketingBannerArea displayPlace="menu" />
        </div>
        {/* Standort-Switcher (nur wenn mehrere Locations) */}
        {locations.length > 1 && (
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedLocationName}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {locations.map((loc) => (
                  <DropdownMenuItem
                    key={loc.id}
                    onClick={() => handleLocationChange(loc.id)}
                  >
                    {loc.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Warenkorb Button (Floating oder in Header) */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              onClick={() => setCartOpen(true)}
              size="lg"
              className="rounded-full shadow-lg h-14 px-6 gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Warenkorb ({cart.length})</span>
              <span className="ml-2 font-bold">{formatCurrency(totalAmount)}</span>
            </Button>
          </div>
        )}

        {/* Menü Bereich */}
        <MenuWeek 
          locationId={locationId} 
          onSelectItem={handleSelectItem}
          cart={cart}
          onQuantityChange={handleQuantityChange}
        />

        {/* Collapsible Warenkorb Sidebar */}
        <CartSidebar
          cart={cart}
          isOpen={cartOpen}
          onOpenChange={setCartOpen}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleQuantityChange}
          totalAmount={totalAmount}
          locationId={locationId}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>
    </div>
  )
}
