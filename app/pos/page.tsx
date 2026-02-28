'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X, Plus, Minus, ChefHat, MapPin, Search, Loader2, CreditCard, Banknote, Wallet, LogOut, SwitchCamera } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Location {
  id: string
  name: string
  address: string | null
}

interface MenuItem {
  id: string
  dish: { id: string; name: string; description: string | null; imageUrl: string | null; category: string | null }
  price: number
  originalPrice: number
  isPromotion: boolean
  promotionLabel: string | null
  soldOut: boolean
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface Customer {
  id: string
  name: string | null
  email: string
  walletBalance: number
}

type PaymentMethod = 'cash' | 'sumup' | 'wallet'

interface CompletedOrder {
  orderId: string
  pickupCode: string
  totalAmount: number
  paymentMethod: PaymentMethod
  change: number | null
  items: { name: string; quantity: number; price: number }[]
  customer: { name: string | null; email: string } | null
  location: string
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function POSHeader({
  locationName,
  cartCount,
  onShowCart,
  onSwitchLocation,
}: {
  locationName: string
  cartCount: number
  onShowCart: () => void
  onSwitchLocation: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-400 leading-none">Kasse</p>
          <p className="text-sm font-semibold text-white leading-tight">{locationName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSwitchLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
        >
          <SwitchCamera className="w-3.5 h-3.5" />
          Standort wechseln
        </button>
        {/* Mobile cart toggle */}
        <button
          onClick={onShowCart}
          className="relative flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
              {cartCount}
            </span>
          )}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-700 rounded-lg hover:border-red-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Abmelden
        </button>
      </div>
    </header>
  )
}

function MenuTile({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const category = item.dish.category ?? ''
  return (
    <button
      onClick={() => !item.soldOut && onAdd(item)}
      disabled={item.soldOut}
      className={`relative flex flex-col rounded-2xl border overflow-hidden text-left transition-all active:scale-95
        ${item.soldOut
          ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
          : 'border-gray-700 bg-gray-800 hover:border-blue-500 hover:bg-gray-750 cursor-pointer shadow-md hover:shadow-blue-900/20'
        }`}
    >
      {/* Dish image or placeholder */}
      <div className="w-full aspect-[4/3] bg-gray-700 flex items-center justify-center overflow-hidden">
        {item.dish.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.dish.imageUrl} alt={item.dish.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🍽️</span>
        )}
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {item.isPromotion && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full">
            {item.promotionLabel ?? 'Aktion'}
          </span>
        )}
        {item.soldOut && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">
            Ausverkauft
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        {category && <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{category}</p>}
        <p className="text-sm font-semibold text-white leading-snug">{item.dish.name}</p>
        {item.dish.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{item.dish.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-blue-400">{formatEur(item.price)}</span>
            {item.isPromotion && item.price !== item.originalPrice && (
              <span className="ml-1.5 text-xs text-gray-500 line-through">{formatEur(item.originalPrice)}</span>
            )}
          </div>
          {!item.soldOut && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white">
              <Plus className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function CustomerSearchField({
  customer,
  onSelect,
  onClear,
}: {
  customer: Customer | null
  onSelect: (c: Customer) => void
  onClear: () => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    setQ(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (v.length < 2) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/pos/customers?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        setResults(data)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  if (customer) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-blue-900/40 border border-blue-700 rounded-xl">
        <div>
          <p className="text-sm font-medium text-white">{customer.name ?? customer.email}</p>
          <p className="text-xs text-gray-400">{customer.email} · Wallet: {formatEur(customer.walletBalance)}</p>
        </div>
        <button onClick={onClear} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl focus-within:border-blue-500 transition-colors">
        {searching ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-gray-400 shrink-0" />}
        <input
          type="text"
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Kunde suchen (Name / E-Mail)…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
        />
        {q && <button onClick={() => { setQ(''); setResults([]) }} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
      </div>
      {results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => { onSelect(r); setQ(''); setResults([]) }}
                className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-gray-700 text-left transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{r.name ?? r.email}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
                <span className="text-xs text-blue-400 font-medium">{formatEur(r.walletBalance)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CartPanel({
  cart,
  customer,
  onQuantityChange,
  onClearCart,
  onSelectCustomer,
  onClearCustomer,
  onCheckout,
  checkoutLoading,
}: {
  cart: CartItem[]
  customer: Customer | null
  onQuantityChange: (menuItemId: string, delta: number) => void
  onClearCart: () => void
  onSelectCustomer: (c: Customer) => void
  onClearCustomer: () => void
  onCheckout: (method: PaymentMethod, cashGiven?: number) => Promise<void>
  checkoutLoading: boolean
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const change = paymentMethod === 'cash' && cashGiven ? parseFloat(cashGiven) - total : null

  async function handlePay() {
    setError(null)
    try {
      await onCheckout(paymentMethod, paymentMethod === 'cash' ? parseFloat(cashGiven) : undefined)
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Bezahlen.')
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Cart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-400" />
          Warenkorb
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-600 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
          )}
        </h2>
        {cart.length > 0 && (
          <button onClick={onClearCart} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            Leeren
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <ShoppingCart className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">Noch keine Artikel ausgewählt</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center gap-3 p-2 bg-gray-800 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatEur(item.price)} / Stück</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onQuantityChange(item.menuItemId, -1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item.menuItemId, +1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="w-14 text-right shrink-0">
                <p className="text-sm font-semibold text-white">{formatEur(item.price * item.quantity)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Divider + Customer + Checkout */}
      {cart.length > 0 && (
        <div className="border-t border-gray-800 px-4 pt-3 pb-4 space-y-3">
          {/* Customer */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Kunde (optional)</p>
            <CustomerSearchField customer={customer} onSelect={onSelectCustomer} onClear={onClearCustomer} />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-2 border-t border-gray-800">
            <span className="text-sm text-gray-400">Gesamt</span>
            <span className="text-xl font-bold text-white">{formatEur(total)}</span>
          </div>

          {/* Payment method */}
          {!showPayment ? (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Zur Kasse
            </button>
          ) : (
            <div className="space-y-3">
              {/* Method selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { value: 'cash', label: 'Bar', icon: Banknote },
                  { value: 'sumup', label: 'SumUp', icon: CreditCard },
                  { value: 'wallet', label: 'Wallet', icon: Wallet, disabled: !customer },
                ] as const).map(({ value, label, icon: Icon, disabled }) => (
                  <button
                    key={value}
                    onClick={() => !disabled && setPaymentMethod(value as PaymentMethod)}
                    disabled={disabled}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all
                      ${paymentMethod === value
                        ? 'border-blue-500 bg-blue-900/50 text-blue-300'
                        : disabled
                        ? 'border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                        : 'border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {value === 'wallet' && customer && (
                      <span className="text-[9px] text-gray-400">{formatEur(customer.walletBalance)}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Cash given input */}
              {paymentMethod === 'cash' && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Gegeben (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={total}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
                  />
                  {change != null && change >= 0 && (
                    <p className="text-sm text-green-400 font-semibold text-right">
                      Rückgeld: {formatEur(change)}
                    </p>
                  )}
                </div>
              )}

              {/* SumUp hint */}
              {paymentMethod === 'sumup' && (
                <p className="text-xs text-gray-400 text-center">
                  Bitte Terminal bereitstellen und Zahlung am Gerät bestätigen.
                </p>
              )}

              {/* Wallet balance warning */}
              {paymentMethod === 'wallet' && customer && customer.walletBalance < total && (
                <p className="text-xs text-red-400 text-center">
                  Guthaben unzureichend ({formatEur(customer.walletBalance)})
                </p>
              )}

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPayment(false); setError(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:text-white hover:border-gray-500 transition-colors"
                >
                  Zurück
                </button>
                <button
                  onClick={handlePay}
                  disabled={checkoutLoading || (paymentMethod === 'wallet' && customer && customer.walletBalance < total)}
                  className="flex-2 flex-grow py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Bezahlen {formatEur(total)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function POSPage() {
  const router = useRouter()

  // Location state
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('Alle')

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // ── Load locations ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Restore location from sessionStorage
    const saved = sessionStorage.getItem('pos-location')
    if (saved) {
      try { setSelectedLocation(JSON.parse(saved)) } catch { /* ignore */ }
    }

    fetch('/api/public/locations')
      .then((r) => r.json())
      .then((data: Location[]) => setLocations(data))
      .catch(() => setLocations([]))
      .finally(() => setLocationLoading(false))
  }, [])

  // ── Load menu when location changes ───────────────────────────────────────
  useEffect(() => {
    if (!selectedLocation) return
    setMenuError(null)
    setMenuLoading(true)
    fetch(`/api/pos/menu?locationId=${selectedLocation.id}&date=${today()}`)
      .then((r) => r.json())
      .then((data: MenuItem[]) => {
        if (!Array.isArray(data)) throw new Error('Fehler')
        setMenuItems(data)
        setCategoryFilter('Alle')
      })
      .catch(() => setMenuError('Menü konnte nicht geladen werden.'))
      .finally(() => setMenuLoading(false))
  }, [selectedLocation])

  // ── Cart helpers ──────────────────────────────────────────────────────────
  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItemId: item.id, name: item.dish.name, price: item.price, quantity: 1 }]
    })
  }

  function changeQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c)
      return updated.filter((c) => c.quantity > 0)
    })
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  async function handleCheckout(paymentMethod: PaymentMethod, cashGiven?: number) {
    if (!selectedLocation || cart.length === 0) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocation.id,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
          paymentMethod,
          customerId: customer?.id ?? null,
          cashGiven,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')

      // Store for receipt
      sessionStorage.setItem('pos-last-order', JSON.stringify(data))
      router.push(`/pos/receipt/${data.orderId}`)
    } finally {
      setCheckoutLoading(false)
    }
  }

  function selectLocation(loc: Location) {
    setSelectedLocation(loc)
    sessionStorage.setItem('pos-location', JSON.stringify(loc))
    setCart([])
    setCustomer(null)
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const categories = ['Alle', ...Array.from(new Set(menuItems.map((m) => m.dish.category ?? 'Sonstiges')))]
  const filteredMenu = categoryFilter === 'Alle' ? menuItems : menuItems.filter((m) => (m.dish.category ?? 'Sonstiges') === categoryFilter)

  // ── Location Picker ───────────────────────────────────────────────────────
  if (locationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!selectedLocation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Kassen-System</h1>
          <p className="text-gray-400 mt-1">Standort für diese Sitzung auswählen</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {locations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">Keine aktiven Standorte gefunden.</p>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => selectLocation(loc)}
                className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-gray-750 transition-all text-left group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700 group-hover:bg-blue-900">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{loc.name}</p>
                  {loc.address && <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>}
                </div>
              </button>
            ))
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    )
  }

  // ── Main POS ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <POSHeader
        locationName={selectedLocation.name}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onShowCart={() => setMobileCartOpen(true)}
        onSwitchLocation={() => {
          setSelectedLocation(null)
          sessionStorage.removeItem('pos-location')
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Menu grid ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          {/* Category tabs */}
          {categories.length > 1 && (
            <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0
                    ${categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
            {menuLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : menuError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-gray-400">{menuError}</p>
                <button onClick={() => setSelectedLocation({ ...selectedLocation })} className="text-sm text-blue-400 hover:underline">
                  Erneut laden
                </button>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-gray-500 text-sm">Heute kein Menü geplant für diesen Standort.</p>
                <p className="text-gray-600 text-xs mt-1">Bitte Menüplan im Admin-Bereich prüfen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredMenu.map((item) => (
                  <MenuTile key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── Right: Cart (desktop) ── */}
        <aside className="hidden md:flex flex-col w-80 xl:w-96 shrink-0 overflow-hidden">
          <CartPanel
            cart={cart}
            customer={customer}
            onQuantityChange={changeQuantity}
            onClearCart={() => { setCart([]); setCustomer(null) }}
            onSelectCustomer={setCustomer}
            onClearCustomer={() => setCustomer(null)}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
          />
        </aside>
      </div>

      {/* ── Mobile Cart Drawer ── */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileCartOpen(false)} />
          <div className="relative flex flex-col h-[85vh] bg-gray-900 rounded-t-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-semibold text-white">Warenkorb</span>
              <button onClick={() => setMobileCartOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={cart}
                customer={customer}
                onQuantityChange={changeQuantity}
                onClearCart={() => { setCart([]); setCustomer(null); setMobileCartOpen(false) }}
                onSelectCustomer={setCustomer}
                onClearCustomer={() => setCustomer(null)}
                onCheckout={async (m, c) => { await handleCheckout(m, c); setMobileCartOpen(false) }}
                checkoutLoading={checkoutLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
