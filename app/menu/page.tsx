'use client'

import { useState } from 'react'
import MenuWeek from '@/components/menu/MenuWeek'
import CartSidebar from '@/components/order/CartSidebar'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  menuItemId: string
  quantity: number
  dishName: string
  price: number
}

export default function MenuPage() {
  const locationId = 'demo-location-1'
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const handleSelectItem = (item: any) => {
    const existingItem = cart.find((i) => i.menuItemId === item.id)
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          quantity: 1,
          dishName: item.dish.name,
          price: item.price,
        },
      ])
    }
  }

  const handleRemoveItem = (menuItemId: string) => {
    setCart(cart.filter((i) => i.menuItemId !== menuItemId))
  }

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
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

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
        <MenuWeek locationId={locationId} onSelectItem={handleSelectItem} />

        {/* Collapsible Warenkorb Sidebar */}
        <CartSidebar
          cart={cart}
          isOpen={cartOpen}
          onOpenChange={setCartOpen}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
          totalAmount={totalAmount}
          locationId={locationId}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>
    </div>
  )
}
