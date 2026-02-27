'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MenuWeek from '@/components/menu/MenuWeek'
import CartSidebar from '@/components/order/CartSidebar'
import { MarketingSlotArea } from '@/components/marketing/MarketingSlotArea'
import { MarketingBannerArea } from '@/components/marketing/MarketingBannerArea'
import { IncentiveCodesWidget } from '@/components/marketing/IncentiveCodesWidget'
import { Button } from '@/components/ui/button'
import { ShoppingCart, MapPin, ChevronDown, ArrowLeft } from 'lucide-react'
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
  address?: string | null
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: sessionStatus } = useSession()

  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const setSelectedLocationId = useCallback((id: string) => {
    setSelectedLocationIdState(id)
    try { localStorage.setItem(MENU_LOCATION_STORAGE_KEY, id) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Öffentliches API – kein Auth erforderlich (PROJ-25)
        const res = await fetch('/api/public/locations')
        if (!res.ok) return
        const data: LocationOption[] = await res.json()

        if (cancelled) return

        if (!Array.isArray(data) || data.length === 0) {
          // Keine Locations → zurück zur Auswahl
          router.replace('/')
          return
        }

        setLocations(data)

        // Priority: 1) URL-Param, 2) localStorage, 3) erste Location
        const urlParam = searchParams.get('locationId')
        const stored = (() => { try { return localStorage.getItem(MENU_LOCATION_STORAGE_KEY) } catch { return null } })()

        const validIds = data.map((l) => l.id)

        if (urlParam && validIds.includes(urlParam)) {
          setSelectedLocationIdState(urlParam)
          try { localStorage.setItem(MENU_LOCATION_STORAGE_KEY, urlParam) } catch { /* ignore */ }
        } else if (stored && validIds.includes(stored)) {
          setSelectedLocationIdState(stored)
        } else if (data[0]) {
          // Kein valider Param/Storage → zurück zur Auswahl wenn kein eindeutiger Fallback
          if (data.length === 1) {
            setSelectedLocationIdState(data[0].id)
            try { localStorage.setItem(MENU_LOCATION_STORAGE_KEY, data[0].id) } catch { /* ignore */ }
          } else {
            // Mehrere Locations, keine Vorauswahl möglich → zurück zum Picker
            router.replace('/')
            return
          }
        }
      } catch {
        if (!cancelled) setLocations([])
      } finally {
        if (!cancelled) setLocationsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locationId = selectedLocationId ?? (locations[0]?.id ?? '')
  const selectedLocationName = locations.find((l) => l.id === locationId)?.name ?? 'Standort'

  /** Auth-Gate: Nur eingeloggte User dürfen den Warenkorb befüllen */
  const handleSelectItem = (item: any, quantity: number = 1) => {
    if (sessionStatus !== 'authenticated') {
      // Nicht eingeloggt → Login mit callbackUrl
      const callbackUrl = encodeURIComponent(`/menu?locationId=${locationId}`)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    const existingItem = cart.find((i) => i.menuItemId === item.id)
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity <= 0) {
        handleRemoveItem(item.id)
      } else {
        setCart(cart.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: newQuantity } : i
        ))
      }
    } else if (quantity > 0) {
      setCart([...cart, {
        menuItemId: item.id,
        quantity,
        dishName: item.dish.name,
        price: getEffectivePrice(item),
      }])
    }
  }

  const handleQuantityChange = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId)
    } else {
      setCart(cart.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      ))
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
    // URL aktualisieren
    router.replace(`/menu?locationId=${newLocationId}`)
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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

  const isLoggedIn = sessionStatus === 'authenticated'

  return (
    <div className="min-h-screen menu-page-pattern bg-gradient-to-br from-background/95 via-background/90 to-green-50/40 dark:to-green-950/15">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Marketing: Slot menu_top + Banner für Menü-Seite */}
        <div className="space-y-4 mb-6">
          <MarketingSlotArea slotId="menu_top" />
          <MarketingBannerArea displayPlace="menu" />
          {isLoggedIn && <IncentiveCodesWidget />}
        </div>

        {/* Auth-Hinweis für Gäste */}
        {!isLoggedIn && sessionStatus !== 'loading' && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm">
            <span className="text-green-800 dark:text-green-300">
              Du siehst den Speiseplan als Gast. Zum Bestellen bitte einloggen oder registrieren.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-green-400 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 h-8 px-3"
                onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(`/menu?locationId=${locationId}`)}`)}
              >
                Einloggen
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                onClick={() => router.push('/register')}
              >
                Registrieren
              </Button>
            </div>
          </div>
        )}

        {/* Obere Leiste: Kantine-Wechseln + Standort-Switcher */}
        <div className="flex items-center justify-between mb-4 gap-2">
          {/* Zurück zur Kantine-Auswahl */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              try { localStorage.removeItem(MENU_LOCATION_STORAGE_KEY) } catch { /* ignore */ }
              router.push('/')
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kantine wechseln</span>
            <span className="sm:hidden">Wechseln</span>
          </Button>

          {/* Standort-Switcher (nur wenn mehrere Locations) */}
          {locations.length > 1 && (
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
          )}
        </div>

        {/* Warenkorb Button (Floating) */}
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
