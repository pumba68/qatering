'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrdersAreaChart } from '@/components/charts/OrdersAreaChart'
import { TopDishesBarChart } from '@/components/charts/TopDishesBarChart'
import { RevenueKPI } from '@/components/charts/RevenueKPI'
import { Check, X } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
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
  user: {
    name: string | null
    email: string
  }
  items: OrderItem[]
}

interface AnalyticsData {
  orderTrend: Array<{ day: string; currentMonth: number; lastMonth: number }>
  topDishes: Array<{ dish: string; orders: number; rank: number }>
  monthlyRevenue: number
  weeklyOrders: number
}

export default function AdminDashboard() {
  const locationId = 'demo-location-1'
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [filter, setFilter] = useState<'today' | 'all'>('today')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
    fetchAnalytics()
    const interval = setInterval(() => {
      fetchOrders()
      fetchAnalytics()
    }, 30000)
    return () => clearInterval(interval)
  }, [filter, locationId, selectedStatus])

  async function fetchAnalytics() {
    try {
      setAnalyticsLoading(true)
      const response = await fetch(`/api/admin/analytics?locationId=${locationId}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function fetchOrders() {
    try {
      setLoading(true)
      let url = `/api/orders?locationId=${locationId}`

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        url += `&pickupDate=${today}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Fehler beim Laden der Bestellungen')
      const data = await response.json()

      let filteredData = data
      if (selectedStatus !== 'ALL') {
        filteredData = data.filter((o: Order) => o.status === selectedStatus)
      }

      filteredData.sort((a: Order, b: Order) => {
        const statusOrder: Record<string, number> = {
          PENDING: 1,
          CONFIRMED: 2,
          PREPARING: 3,
          READY: 4,
          PICKED_UP: 5,
          CANCELLED: 6,
        }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      setOrders(filteredData)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchOrders()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fehler beim Aktualisieren')
    }
  }

  async function confirmOrder(orderId: string) {
    await updateOrderStatus(orderId, 'CONFIRMED')
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Möchten Sie diese Bestellung wirklich stornieren?')) return
    await updateOrderStatus(orderId, 'CANCELLED')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
      READY: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
      PICKED_UP: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: '⏳ Ausstehend',
      CONFIRMED: '✅ Bestätigt',
      PREPARING: '👨‍🍳 In Zubereitung',
      READY: '✅ Fertig',
      PICKED_UP: '✅ Abgeholt',
      CANCELLED: '❌ Storniert',
    }
    return labels[status] || status
  }

  // Gruppiere Bestellungen nach Datum
  const ordersByDate = orders.reduce((acc, order) => {
    const dateKey = new Date(order.pickupDate).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  const sortedDates = Object.keys(ordersByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            🍳 Küchen-Dashboard
          </h1>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* KPI Cards */}
          <div className="flex flex-col h-[350px]">
            {analyticsLoading ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">Lade KPI...</div>
                </CardContent>
              </Card>
            ) : analytics ? (
              <RevenueKPI revenue={analytics.monthlyRevenue} weeklyOrders={analytics.weeklyOrders} />
            ) : null}
          </div>

          {/* Area Chart */}
          <div>
            {analyticsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">Lade Chart...</div>
                </CardContent>
              </Card>
            ) : analytics ? (
              <OrdersAreaChart data={analytics.orderTrend} />
            ) : null}
          </div>

          {/* Bar Chart */}
          <div>
            {analyticsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">Lade Chart...</div>
                </CardContent>
              </Card>
            ) : analytics ? (
              <TopDishesBarChart data={analytics.topDishes} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Bestellübersicht mit akzentuiertem Hintergrund */}
      <div className="px-6 pb-8">
        <div className="bg-muted/50 rounded-lg border border-border p-6 space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Bestellübersicht</h2>
            
            {/* Filter */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('today')}
                  variant={filter === 'today' ? 'default' : 'secondary'}
                >
                  Heute
                </Button>
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'secondary'}
                >
                  Alle
                </Button>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="ALL">Alle Status</option>
                <option value="PENDING">Ausstehend</option>
                <option value="CONFIRMED">Bestätigt</option>
                <option value="PREPARING">In Zubereitung</option>
                <option value="READY">Fertig</option>
                <option value="PICKED_UP">Abgeholt</option>
              </select>
            </div>
          </div>

          {/* Tabellarische Ansicht */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Lade Bestellungen...</div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Keine Bestellungen gefunden
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dateOrders = ordersByDate[dateKey]
                const date = new Date(dateKey)

                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="border-b border-border pb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {formatDate(date)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dateOrders.length} Bestellung{dateOrders.length !== 1 ? 'en' : ''}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                              Bestellnummer
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                              Besteller
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                              Gericht
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                              Gesamtpreis
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                              Aktionen
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateOrders.map((order) => {
                            const dishesText = order.items
                              .map((item) => `${item.menuItem.dish.name} × ${item.quantity}`)
                              .join(', ')

                            return (
                              <tr
                                key={order.id}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <span className="font-mono font-medium text-foreground">
                                    {order.pickupCode}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">
                                  {order.user.name || order.user.email}
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">
                                  {dishesText}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(order.totalAmount)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    {order.status !== 'CANCELLED' && order.status !== 'PICKED_UP' && (
                                      <>
                                        {order.status === 'PENDING' && (
                                          <Button
                                            onClick={() => confirmOrder(order.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                            title="Bestätigen"
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <Button
                                          onClick={() => cancelOrder(order.id)}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          title="Stornieren"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    {order.status === 'CANCELLED' && (
                                      <span className="text-xs text-muted-foreground italic">
                                        Storniert
                                      </span>
                                    )}
                                    {order.status === 'PICKED_UP' && (
                                      <span className="text-xs text-muted-foreground italic">
                                        Abgeholt
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}