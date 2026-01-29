'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactGridLayout from 'react-grid-layout/legacy'
import { useContainerWidth } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OrdersAreaChart } from '@/components/charts/OrdersAreaChart'
import { TopDishesBarChart } from '@/components/charts/TopDishesBarChart'
import { SchaltzentraleKPIs } from '@/components/charts/SchaltzentraleKPIs'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { WeekdayBarChart } from '@/components/charts/WeekdayBarChart'
import { LayoutDashboard, ListOrdered } from 'lucide-react'

const DASHBOARD_LAYOUT_KEY = 'admin-dashboard-grid-layout'
const WIDGET_IDS = ['orderTrend', 'topDishes', 'statusPie', 'weekdayBar'] as const
type WidgetId = (typeof WIDGET_IDS)[number]

const DEFAULT_LAYOUT: Layout = [
  { i: 'orderTrend', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 1, maxW: 12, maxH: 4 },
  { i: 'topDishes', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 1, maxW: 12, maxH: 4 },
  { i: 'statusPie', x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 1, maxW: 12, maxH: 4 },
  { i: 'weekdayBar', x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 1, maxW: 12, maxH: 4 },
]

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function loadLayout(): Layout {
  if (typeof window === 'undefined') return [...DEFAULT_LAYOUT]
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_KEY)
    if (!raw) return [...DEFAULT_LAYOUT]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_LAYOUT]
    const validSet = new Set(WIDGET_IDS)
    const items: Layout[number][] = []
    for (const item of parsed) {
      if (!item || typeof item.i !== 'string' || !validSet.has(item.i as WidgetId)) continue
      items.push({
        i: item.i,
        x: num(item.x, 0),
        y: num(item.y, 0),
        w: num(item.w, 6),
        h: num(item.h, 2),
        minW: num(item.minW, 4),
        minH: num(item.minH, 1),
        maxW: num(item.maxW, 12),
        maxH: num(item.maxH, 4),
      })
    }
    const missing = WIDGET_IDS.filter((id) => !items.some((it) => it.i === id))
    if (missing.length) {
      const maxY = items.length ? Math.max(...items.map((it) => it.y + it.h)) : 0
      missing.forEach((id, idx) => {
        items.push({
          i: id,
          x: (idx % 2) * 6,
          y: maxY + Math.floor(idx / 2) * 2,
          w: 6,
          h: 2,
          minW: 4,
          minH: 1,
          maxW: 12,
          maxH: 4,
        })
      })
    }
    return items.length === 4 ? (items as Layout) : [...DEFAULT_LAYOUT]
  } catch {
    return [...DEFAULT_LAYOUT]
  }
}

function resetLayout(): void {
  try {
    localStorage.removeItem(DASHBOARD_LAYOUT_KEY)
  } catch {
    // ignore
  }
}

function saveLayout(layout: Layout) {
  try {
    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layout))
  } catch {
    // ignore
  }
}

type Period = 'today' | '7days' | 'week' | 'month' | '30days'

interface Location {
  id: string
  name: string
}

interface AnalyticsData {
  orderTrend: Array<{ day: string; currentMonth: number; lastMonth: number }>
  topDishes: Array<{ dish: string; orders: number; rank: number }>
  monthlyRevenue: number
  orderCount: number
  aov: number
  cancellationRate: number
  activeCustomers: number
  statusDistribution: Array<{ status: string; count: number }>
  ordersByWeekday: Array<{ day: string; count: number }>
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Heute' },
  { value: '7days', label: 'Letzte 7 Tage' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
  { value: '30days', label: 'Letzte 30 Tage' },
]

export default function AdminDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationId] = useState<string>('all')
  const [period, setPeriod] = useState<Period>('month')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [layout, setLayout] = useState<Layout>(() => {
    try {
      return loadLayout()
    } catch {
      return [...DEFAULT_LAYOUT]
    }
  })
  const { width, containerRef, mounted } = useContainerWidth()

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout)
    saveLayout(newLayout)
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 60000)
    return () => clearInterval(interval)
  }, [locationId, period])

  async function fetchLocations() {
    try {
      const res = await fetch('/api/admin/locations')
      if (!res.ok) throw new Error('Fehler beim Laden der Standorte')
      const data = await res.json()
      setLocations(Array.isArray(data) ? data : [])
      if (!locationId || locationId === 'all') setLocationId('all')
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchAnalytics() {
    try {
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      const params = new URLSearchParams()
      if (locationId && locationId !== 'all') params.set('locationId', locationId)
      params.set('period', period)
      const response = await fetch(`/api/admin/analytics?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (e) {
      setAnalyticsError(e instanceof Error ? e.message : 'Fehler beim Laden')
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-border/50 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-md">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Schaltzentrale</h1>
                <p className="text-sm text-muted-foreground mt-0.5">KPIs & Auswertungen</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter: Standort */}
              <div className="flex items-center gap-2">
                <label htmlFor="location-filter" className="text-sm font-medium text-foreground sr-only">
                  Standort
                </label>
                <select
                  id="location-filter"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Alle Standorte</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Filter: Zeitraum */}
              <div className="flex items-center gap-2">
                <label htmlFor="period-filter" className="text-sm font-medium text-foreground sr-only">
                  Zeitraum
                </label>
                <select
                  id="period-filter"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* CTA Bestellungen verwalten */}
              <Button
                asChild
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                <Link href="/admin/orders" className="inline-flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" />
                  Bestellungen verwalten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        {/* KPI-Zeile */}
        <section className="mb-6 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '100ms' }}>
          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="border-border/50 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade KPI…</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analyticsError ? (
            <Card className="border-border/50 rounded-2xl">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-2">{analyticsError}</p>
                <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                  Erneut laden
                </Button>
              </CardContent>
            </Card>
          ) : analytics ? (
            <SchaltzentraleKPIs
              data={{
                periodRevenue: analytics.monthlyRevenue,
                orderCount: analytics.orderCount,
                aov: analytics.aov,
                cancellationRate: analytics.cancellationRate,
                activeCustomers: analytics.activeCustomers,
              }}
            />
          ) : null}
        </section>

        {/* Chart-Grid: Drag & Drop + Resize (Layout in localStorage) */}
        <section className="mb-6">
          <div ref={containerRef as React.RefObject<HTMLDivElement>}>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Charts anordnen und Größe anpassen: Karten ziehen oder an der Ecke zum Vergrößern/Verkleinern ziehen.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                resetLayout()
                setLayout([...DEFAULT_LAYOUT])
              }}
            >
              Layout zurücksetzen
            </Button>
          </div>
          {mounted && width > 0 && (
            <ReactGridLayout
              layout={layout}
              onLayoutChange={handleLayoutChange}
              width={width}
              cols={12}
              rowHeight={120}
              margin={[24, 24]}
              containerPadding={[0, 0]}
              compactType="vertical"
              isDraggable
              isResizable
              resizeHandles={['se', 's', 'e']}
              className="dashboard-grid"
            >
              {layout.map((item) => (
                <div key={item.i} className="h-full min-h-0 flex flex-col">
                  {item.i === 'orderTrend' &&
                    (analyticsLoading ? (
                      <Card className="border-border/50 rounded-2xl h-full">
                        <CardContent className="p-6 h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Lade Chart…</span>
                        </CardContent>
                      </Card>
                    ) : analytics ? (
                      <div className="h-full">
                        <OrdersAreaChart data={analytics.orderTrend} />
                      </div>
                    ) : null)}
                  {item.i === 'topDishes' &&
                    (analyticsLoading ? (
                      <Card className="border-border/50 rounded-2xl h-full">
                        <CardContent className="p-6 h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Lade Chart…</span>
                        </CardContent>
                      </Card>
                    ) : analytics ? (
                      <div className="h-full">
                        <TopDishesBarChart data={analytics.topDishes} />
                      </div>
                    ) : null)}
                  {item.i === 'statusPie' &&
                    (analyticsLoading ? (
                      <Card className="border-border/50 rounded-2xl h-full">
                        <CardContent className="p-6 h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Lade Chart…</span>
                        </CardContent>
                      </Card>
                    ) : analytics ? (
                      <div className="h-full">
                        <StatusPieChart data={analytics.statusDistribution} />
                      </div>
                    ) : null)}
                  {item.i === 'weekdayBar' &&
                    (analyticsLoading ? (
                      <Card className="border-border/50 rounded-2xl h-full">
                        <CardContent className="p-6 h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Lade Chart…</span>
                        </CardContent>
                      </Card>
                    ) : analytics ? (
                      <div className="h-full">
                        <WeekdayBarChart data={analytics.ordersByWeekday} />
                      </div>
                    ) : null)}
                </div>
              ))}
            </ReactGridLayout>
          )}
          </div>
        </section>

        {/* CTA-Bereich */}
        <section className="animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '450ms' }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Link href="/admin/orders" className="inline-flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                Bestellungen verwalten
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Alle Bestellungen einsehen und bearbeiten.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
