'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Euro, ShoppingCart, Users } from 'lucide-react'

interface RevenueKPIProps {
  revenue: number
  weeklyOrders: number
}

export function RevenueKPI({ revenue, weeklyOrders }: RevenueKPIProps) {
  // Berechne prozentuale Änderung (simuliert - in Produktion aus API)
  const revenueChange = 12.5 // Beispiel: +12.5%
  const ordersChange = 8.3 // Beispiel: +8.3%
  
  // Sicherstellen, dass Werte Zahlen sind
  const revenueNum = typeof revenue === 'number' ? revenue : (typeof revenue === 'string' ? parseFloat(revenue) : 0) || 0
  const weeklyOrdersNum = typeof weeklyOrders === 'number' ? weeklyOrders : (typeof weeklyOrders === 'string' ? parseFloat(weeklyOrders) : 0) || 0
  const avgOrderValue = revenueNum > 0 && weeklyOrdersNum > 0 ? revenueNum / weeklyOrdersNum : 0
  const avgOrderChange = 5.2 // Beispiel: +5.2%

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Umsatz Karte mit Orange-Pink Gradient */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 via-pink-500 to-pink-600">
        {/* Subtile Hintergrund-Formen */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Weekly Sales</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {formatCurrency(revenueNum)}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Increased by {revenueChange}%</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
              <Euro className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bestellungen Karte mit Blau Gradient */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        {/* Subtile Hintergrund-Formen */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Weekly Orders</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {weeklyOrdersNum.toLocaleString('de-DE')}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Increased by {ordersChange}%</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durchschnittlicher Bestellwert Karte mit Teal-Grün Gradient */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600">
        {/* Subtile Hintergrund-Formen */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Average Order Value</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {formatCurrency(avgOrderValue)}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Increased by {avgOrderChange}%</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}