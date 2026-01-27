'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  menuItemId: string
  quantity: number
  dishName: string
  price: number
}

interface OrderCartProps {
  cart: CartItem[]
  onRemoveItem: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  totalAmount: number
  locationId: string
  selectedDate: Date | null
  onDateChange: (date: Date | null) => void
}

export default function OrderCart({
  cart,
  onRemoveItem,
  onUpdateQuantity,
  totalAmount,
  locationId,
  selectedDate,
  onDateChange,
}: OrderCartProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!selectedDate) {
      alert('Bitte wähle ein Abholdatum aus')
      return
    }

    if (!session?.user) {
      router.push('/login?redirect=/menu')
      return
    }

    setIsProcessing(true)
    try {
      const userId = (session.user as any).id

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          locationId,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
          pickupDate: selectedDate.toISOString(),
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen der Bestellung')
      }

      const order = await response.json()
      
      // Weiterleitung zur Bestellbestätigung
      window.location.href = `/order/confirmation/${order.id}`
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fehler beim Checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 sticky top-4 border border-border">
      <h2 className="text-2xl font-bold text-foreground mb-4">Warenkorb</h2>

      {cart.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Warenkorb ist leer
        </p>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center justify-between border-b border-border pb-3 transition-all duration-200 hover:bg-muted/50 -mx-2 px-2 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.dishName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.menuItemId)}
                    className="ml-2 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Abholdatum *
            </label>
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value) : null)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              rows={2}
              placeholder="Allergien, Wünsche, etc."
            />
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <div className="flex justify-between items-center text-lg font-bold text-foreground">
              <span>Gesamt:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing || !selectedDate}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Wird verarbeitet...' : 'Bestellen'}
          </button>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            * In Phase 1: Zahlung vor Ort. Phase 2: Online-Zahlung
          </p>
        </>
      )}
    </div>
  )
}
