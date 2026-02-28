'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckCircle, Printer, ShoppingCart, ChefHat } from 'lucide-react'

interface OrderData {
  orderId: string
  pickupCode: string
  totalAmount: number
  paymentMethod: string
  change: number | null
  items: { name: string; quantity: number; price: number }[]
  customer: { name: string | null; email: string } | null
  location: string
  createdAt: string
}

function formatEur(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Barzahlung',
  BAR: 'Barzahlung',
  sumup: 'SumUp Terminal',
  SUMUP: 'SumUp Terminal',
  wallet: 'Wallet',
  WALLET: 'Wallet',
}

export default function POSReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<OrderData | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('pos-last-order')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.orderId === params.orderId) {
          setOrder(data)
          return
        }
      } catch { /* ignore */ }
    }
    // Fallback: navigate back if order not found in session
    router.replace('/pos')
  }, [params.orderId, router])

  function handleNewSale() {
    sessionStorage.removeItem('pos-last-order')
    router.push('/pos')
  }

  function handlePrint() {
    window.print()
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-950 print:bg-white print:min-h-0">
      {/* Screen-only actions */}
      <div className="print:hidden w-full max-w-sm mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-900 mb-2">
          <CheckCircle className="w-9 h-9 text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Verkauf abgeschlossen</h1>
        <p className="text-sm text-gray-400">{order.location}</p>
      </div>

      {/* Receipt card (screen) / receipt slip (print) */}
      <div
        id="receipt"
        className="w-full max-w-sm bg-white text-gray-900 rounded-2xl print:rounded-none print:shadow-none shadow-2xl overflow-hidden"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Receipt header */}
        <div className="text-center px-5 pt-5 pb-3 border-b border-dashed border-gray-300">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ChefHat className="w-5 h-5 text-gray-700" />
            <span className="font-bold text-base uppercase tracking-widest">{order.location}</span>
          </div>
          <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>

        {/* Items */}
        <div className="px-5 py-3 space-y-1.5 border-b border-dashed border-gray-300">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="flex-1">
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium ml-3 shrink-0">{formatEur(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-3 border-b border-dashed border-gray-300 space-y-1">
          <div className="flex justify-between font-bold text-base">
            <span>Gesamt</span>
            <span>{formatEur(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Zahlungsart</span>
            <span>{METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
          </div>
          {order.change != null && order.change >= 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Rückgeld</span>
              <span>{formatEur(order.change)}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        {order.customer && (
          <div className="px-5 py-2 border-b border-dashed border-gray-300">
            <p className="text-xs text-gray-500">Kunde: {order.customer.name ?? order.customer.email}</p>
          </div>
        )}

        {/* Pickup code */}
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Abholnummer</p>
          <p className="text-4xl font-black tracking-widest text-gray-900">{order.pickupCode}</p>
          <p className="text-[10px] text-gray-400 mt-2">Bitte Nummer bereithalten</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 text-center border-t border-dashed border-gray-300 pt-3">
          <p className="text-[10px] text-gray-400">Vielen Dank für Ihren Einkauf!</p>
        </div>
      </div>

      {/* Screen-only action buttons */}
      <div className="print:hidden w-full max-w-sm mt-6 flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-700 rounded-2xl text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Drucken
        </button>
        <button
          onClick={handleNewSale}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-semibold text-white transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Neuer Verkauf
        </button>
      </div>

      {/* Print-only styles injected via global CSS trick */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          #receipt { max-width: 80mm; margin: 0 auto; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}
