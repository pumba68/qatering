'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

interface LocationAssignment {
  role: string
  location: {
    id: string
    name: string
    address: string | null
  }
}

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

export default function KitchenDashboard() {
  // ── Location state ────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<LocationAssignment[]>([])
  const [locationId, setLocationId] = useState<string | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // ── Orders state ──────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'today' | 'all'>('today')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)

  // ── Fetch assigned locations on mount ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/kitchen/my-location')
      .then((r) => r.json())
      .then((data: LocationAssignment[] | { error: string }) => {
        if (!Array.isArray(data)) {
          setLocationError((data as { error: string }).error ?? 'Fehler beim Laden der Standorte.')
          return
        }
        setAssignments(data)
        if (data.length === 1) {
          setLocationId(data[0].location.id)
          setLocationName(data[0].location.name)
        } else if (data.length === 0) {
          setLocationError('Kein Standort zugewiesen. Bitte wenden Sie sich an Ihren Administrator.')
        }
        // If multiple → user picks below
      })
      .catch(() => setLocationError('Fehler beim Laden des Standorts.'))
      .finally(() => setLocationLoading(false))
  }, [])

  // ── Fetch orders whenever locationId or filter changes ────────────────────
  useEffect(() => {
    if (!locationId) return
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, locationId])

  async function fetchOrders() {
    if (!locationId) return
    try {
      setLoading(true)
      let url = `/api/orders?locationId=${locationId}`
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        url += `&pickupDate=${today}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Fehler beim Laden der Bestellungen')
      const data: Order[] = await response.json()

      let filteredData = data
      if (selectedStatus !== 'ALL') {
        filteredData = data.filter((o) => o.status === selectedStatus)
      }

      filteredData.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          PENDING: 1,
          CONFIRMED: 2,
          PREPARING: 3,
          READY: 4,
          PICKED_UP: 5,
          CANCELLED: 6,
        }
        const diff = statusOrder[a.status] - statusOrder[b.status]
        if (diff !== 0) return diff
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
      PREPARING: 'bg-purple-100 text-purple-800 border-purple-300',
      READY: 'bg-green-100 text-green-800 border-green-300',
      PICKED_UP: 'bg-gray-100 text-gray-800 border-gray-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    preparing: orders.filter((o) => o.status === 'PREPARING').length,
    ready: orders.filter((o) => o.status === 'READY').length,
  }

  // ── Loading / error / location picker states ──────────────────────────────

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Standortdaten…</p>
      </div>
    )
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-medium">{locationError}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Abmelden
        </button>
      </div>
    )
  }

  // Multiple locations → let the user pick one
  if (assignments.length > 1 && !locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Standort auswählen</h1>
        <p className="text-gray-500">Sie sind mehreren Standorten zugewiesen. Bitte wählen Sie einen aus.</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {assignments.map((a) => (
            <button
              key={a.location.id}
              onClick={() => {
                setLocationId(a.location.id)
                setLocationName(a.location.name)
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-left hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="font-semibold text-gray-900">{a.location.name}</div>
              {a.location.address && (
                <div className="text-sm text-gray-500 mt-0.5">{a.location.address}</div>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-400 hover:text-gray-600 underline mt-2"
        >
          Abmelden
        </button>
      </div>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🍳 Küchen-Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">{locationName}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Location switch if multiple assigned */}
              {assignments.length > 1 && (
                <button
                  onClick={() => setLocationId(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Standort wechseln
                </button>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Heute
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Alle
              </button>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">Alle Status</option>
              <option value="PENDING">Ausstehend</option>
              <option value="CONFIRMED">Bestätigt</option>
              <option value="PREPARING">In Zubereitung</option>
              <option value="READY">Fertig</option>
              <option value="PICKED_UP">Abgeholt</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Ausstehend</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.preparing}</div>
              <div className="text-sm text-gray-600">In Zubereitung</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
              <div className="text-sm text-gray-600">Fertig</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-600">Lade Bestellungen…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Keine Bestellungen gefunden</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-mono text-lg font-bold text-gray-900">{order.pickupCode}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {order.user.name || order.user.email}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">📅 {formatDate(order.pickupDate)}</div>
                  <div className="text-sm text-gray-600">🕐 Bestellt: {formatTime(order.createdAt)}</div>
                </div>

                <div className="border-t pt-4 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm mb-1">
                      <span>
                        {item.menuItem.dish.name} × {item.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Gesamt:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Bestätigen
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Zubereitung starten
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Fertig
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PICKED_UP')}
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
                    >
                      Als abgeholt markieren
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
