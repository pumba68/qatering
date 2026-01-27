'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { formatDate, formatCurrency } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price: string
  menuItem: {
    dish: {
      name: string
    }
  }
}

interface Order {
  id: string
  pickupCode: string
  status: string
  totalAmount: string
  pickupDate: string
  createdAt: string
  items: OrderItem[]
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Bestellung nicht gefunden')
      const data = await response.json()
      setOrder(data)

      // QR-Code generieren
      const qrData = await QRCode.toDataURL(data.pickupCode, {
        width: 300,
        margin: 2,
      })
      setQrCodeDataUrl(qrData)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Lade Bestellung...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">Bestellung nicht gefunden</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <div className="inline-block bg-green-100 dark:bg-green-950/30 rounded-full p-3 mb-4">
              <svg
                className="w-12 h-12 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bestellung bestätigt!
            </h1>
            <p className="text-muted-foreground">
              Ihre Bestellung wurde erfolgreich aufgegeben
            </p>
          </div>

          {/* QR-Code */}
          <div className="bg-muted rounded-lg p-6 mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Abholcode: <span className="font-mono text-xl">{order.pickupCode}</span>
            </h2>
            {qrCodeDataUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrCodeDataUrl} alt="QR-Code" className="border-4 border-card rounded-lg shadow-md" />
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-2">
              Zeigen Sie diesen Code bei der Abholung vor
            </p>
            <p className="text-sm font-medium text-foreground">
              Abholdatum: {formatDate(order.pickupDate)}
            </p>
          </div>

          {/* Bestelldetails */}
          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Bestelldetails
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-foreground"
                >
                  <span>
                    {item.menuItem.dish.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border font-bold text-lg text-foreground">
              <span>Gesamt:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-primary">
              <strong>Status:</strong>{' '}
              {order.status === 'PENDING' && '⏳ Ausstehend'}
              {order.status === 'CONFIRMED' && '✅ Bestätigt'}
              {order.status === 'PREPARING' && '👨‍🍳 In Zubereitung'}
              {order.status === 'READY' && '✅ Fertig zur Abholung'}
              {order.status === 'PICKED_UP' && '✅ Abgeholt'}
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/menu"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Zurück zum Menü
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
