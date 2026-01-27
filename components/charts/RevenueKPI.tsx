'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Euro, ShoppingCart } from 'lucide-react'

interface RevenueKPIProps {
  revenue: number
  weeklyOrders: number
}

export function RevenueKPI({ revenue, weeklyOrders }: RevenueKPIProps) {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="border-l-4 border-l-primary flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Umsatz diesen Monat</CardTitle>
          <CardDescription className="text-xs">Gesamter Umsatz durch Bestellungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {formatCurrency(revenue)}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Aktueller Monat</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Euro className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Bestellungen diese Woche</CardTitle>
          <CardDescription className="text-xs">Anzahl der Bestellungen (Montag - Sonntag)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {weeklyOrders}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Aktuelle Woche</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
              <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}