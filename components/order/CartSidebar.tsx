'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ShoppingCart } from 'lucide-react'

interface CartItem {
  menuItemId: string
  quantity: number
  dishName: string
  price: number
}

interface CartSidebarProps {
  cart: CartItem[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onRemoveItem: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  totalAmount: number
  locationId: string
  selectedDate: Date | null
  onDateChange: (date: Date | null) => void
}

export default function CartSidebar({
  cart,
  isOpen,
  onOpenChange,
  onRemoveItem,
  onUpdateQuantity,
  totalAmount,
  locationId,
  selectedDate,
  onDateChange,
}: CartSidebarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    name: string
    type: string
    discountAmount: string
    finalAmount: string
    freeItem?: { id: string; name: string } | null
  } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  // Öffne Sidebar automatisch, wenn ein Item zum Warenkorb hinzugefügt wird
  // Aber erlaube das Schließen, auch wenn Items im Warenkorb sind
  const prevCartLengthRef = useRef(cart.length)
  
  useEffect(() => {
    // Nur öffnen, wenn ein NEUES Item zum Warenkorb hinzugefügt wurde (cart.length hat sich erhöht)
    // Nicht öffnen, wenn der Benutzer die Sidebar gerade geschlossen hat
    const cartLengthIncreased = cart.length > prevCartLengthRef.current
    
    if (cartLengthIncreased && cart.length > 0 && !isOpen) {
      onOpenChange(true)
    }
    
    // Update ref für nächsten Render
    prevCartLengthRef.current = cart.length
  }, [cart.length, isOpen, onOpenChange])

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Bitte geben Sie einen Coupon-Code ein')
      return
    }

    if (!session?.user) {
      setCouponError('Bitte melden Sie sich an, um einen Coupon zu verwenden')
      return
    }

    setIsValidatingCoupon(true)
    setCouponError('')

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          locationId,
          totalAmount,
          items: cart,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setCouponError(errorData.error || 'Ungültiger Coupon-Code')
        setAppliedCoupon(null)
        return
      }

      const data = await response.json()
      setAppliedCoupon(data.coupon)
      setCouponError('')
    } catch (error) {
      setCouponError('Fehler bei der Coupon-Validierung')
      setAppliedCoupon(null)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
    setCouponError('')
  }

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
          couponCode: appliedCoupon?.code || null,
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Warenkorb
          </SheetTitle>
          <SheetDescription>
            {cart.length > 0
              ? `${cart.length} Artikel${cart.length !== 1 ? '' : ''}`
              : 'Ihr Warenkorb ist leer'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-200px)] flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Warenkorb ist leer
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.dishName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-foreground">{item.quantity}</span>
                      <Button
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                      >
                        +
                      </Button>
                      <Button
                        onClick={() => onRemoveItem(item.menuItemId)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <div className="mt-6 space-y-4 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="pickupDate">Abholdatum *</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value) : null)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notizen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Allergien, Wünsche, etc."
                    className="mt-1"
                  />
                </div>

                {/* Coupon-Eingabe */}
                <div>
                  <Label htmlFor="couponCode">Gutschein-Code (optional)</Label>
                  {!appliedCoupon ? (
                    <div className="mt-1 flex gap-2">
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleValidateCoupon()
                          }
                        }}
                        placeholder="z.B. SUMMER2024"
                        disabled={isValidatingCoupon}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        variant="outline"
                      >
                        {isValidatingCoupon ? '...' : 'Anwenden'}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            ✓ Coupon angewendet: {appliedCoupon.name}
                          </p>
                          {appliedCoupon.type === 'DISCOUNT_PERCENTAGE' && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {appliedCoupon.discountAmount}% Rabatt
                            </p>
                          )}
                          {appliedCoupon.type === 'DISCOUNT_FIXED' && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {formatCurrency(parseFloat(appliedCoupon.discountAmount))} Rabatt
                            </p>
                          )}
                          {appliedCoupon.type === 'FREE_ITEM' && appliedCoupon.freeItem && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Kostenlos: {appliedCoupon.freeItem.name}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleRemoveCoupon}
                          variant="ghost"
                          size="sm"
                          className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-destructive mt-1">{couponError}</p>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-foreground">
                      <span>Zwischensumme:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400 text-sm">
                          <span>Rabatt ({appliedCoupon.code}):</span>
                          <span>
                            {appliedCoupon.type === 'DISCOUNT_PERCENTAGE' || appliedCoupon.type === 'DISCOUNT_FIXED'
                              ? `-${formatCurrency(parseFloat(appliedCoupon.discountAmount))}`
                              : 'Kostenlos'}
                          </span>
                        </div>
                        {appliedCoupon.freeItem && (
                          <div className="flex justify-between items-center text-green-600 dark:text-green-400 text-sm">
                            <span>Extra ({appliedCoupon.freeItem.name}):</span>
                            <span>Gratis</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-foreground pt-2 border-t border-border">
                      <span>Gesamt:</span>
                      <span>
                        {appliedCoupon
                          ? formatCurrency(parseFloat(appliedCoupon.finalAmount))
                          : formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hinweis: Falls Ihr Arbeitgeber eine Bezuschussung mit der Kantine vereinbart hat,
                      wird dieser Zuschuss bei der Bestellbestätigung automatisch vom Gesamtbetrag abgezogen.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || !selectedDate || cart.length === 0}
                  className="w-full"
                >
                  {isProcessing ? 'Wird verarbeitet...' : 'Bestellen'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  * In Phase 1: Zahlung vor Ort. Phase 2: Online-Zahlung
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}