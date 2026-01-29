'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Euro, ShoppingCart, TrendingUp, Users, XCircle } from 'lucide-react'

export interface SchaltzentraleKPIsData {
  periodRevenue: number
  orderCount: number
  aov: number
  cancellationRate: number
  activeCustomers: number
}

interface SchaltzentraleKPIsProps {
  data: SchaltzentraleKPIsData
}

export function SchaltzentraleKPIs({ data }: SchaltzentraleKPIsProps) {
  const revenueNum = typeof data.periodRevenue === 'number' ? data.periodRevenue : 0
  const orderNum = typeof data.orderCount === 'number' ? data.orderCount : 0
  const aovNum = typeof data.aov === 'number' ? data.aov : 0
  const cancelNum = typeof data.cancellationRate === 'number' ? data.cancellationRate : 0
  const activeNum = typeof data.activeCustomers === 'number' ? data.activeCustomers : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {/* Umsatz */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 via-pink-500 to-pink-600 dark:from-orange-500/90 dark:via-pink-500/90 dark:to-pink-600/90">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Umsatz</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {formatCurrency(revenueNum)}
              </h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Euro className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bestellanzahl */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-blue-500/90 dark:via-blue-500/90 dark:to-blue-600/90">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Bestellungen</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {orderNum.toLocaleString('de-DE')}
              </h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ø Bestellwert */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600 dark:from-teal-500/90 dark:via-emerald-500/90 dark:to-green-600/90">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Ø Bestellwert</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {aovNum > 0 ? formatCurrency(aovNum) : '–'}
              </h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stornoquote */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 via-red-500 to-red-600 dark:from-amber-500/90 dark:via-red-500/90 dark:to-red-600/90">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Stornoquote</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">{cancelNum} %</h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aktive Besteller */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-400 via-purple-500 to-purple-600 dark:from-violet-500/90 dark:via-purple-500/90 dark:to-purple-600/90">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-medium mb-2">Aktive Besteller</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {activeNum.toLocaleString('de-DE')}
              </h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
