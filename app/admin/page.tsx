'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ResponsiveReactGridLayout } from 'react-grid-layout/legacy'
import { useContainerWidth } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OrdersAreaChart } from '@/components/charts/OrdersAreaChart'
import { TopDishesBarChart } from '@/components/charts/TopDishesBarChart'
import { SchaltzentraleKPIs } from '@/components/charts/SchaltzentraleKPIs'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { WeekdayBarChart } from '@/components/charts/WeekdayBarChart'
import { LayoutDashboard, ListOrdered, MapPin, ChevronDown, ChefHat, ShoppingBag } from 'lucide-react'
import { useAdminLocation } from '@/components/admin/LocationContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DASHBOARD_LAYOUT_KEY = 'admin-dashboard-responsive-layouts'
const WIDGET_IDS = ['orderTrend', 'topDishes', 'statusPie', 'weekdayBar'] as const
type WidgetId = (typeof WIDGET_IDS)[number]

type BreakpointName = 'lg' | 'md' | 'sm' | 'xs'

const BREAKPOINTS: Record<BreakpointName, number> = { lg: 1200, md: 996, sm: 768, xs: 480 }
const COLS: Record<BreakpointName, number> = { lg: 12, md: 6, sm: 4, xs: 2 }

const DEFAULT_LAYOUTS: Record<BreakpointName, Layout> = {
  lg: [
    { i: 'orderTrend', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 12, maxH: 4 },
    { i: 'topDishes', x: 6, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 12, maxH: 4 },
    { i: 'statusPie', x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 12, maxH: 4 },
    { i: 'weekdayBar', x: 6, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 12, maxH: 4 },
  ],
  md: [
    { i: 'orderTrend', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'topDishes', x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'statusPie', x: 0, y: 4, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'weekdayBar', x: 0, y: 6, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
  ],
  sm: [
    { i: 'orderTrend', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'topDishes', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'statusPie', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'weekdayBar', x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
  ],
  xs: [
    { i: 'orderTrend', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 4 },
    { i: 'topDishes', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 4 },
    { i: 'statusPie', x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 4 },
    { i: 'weekdayBar', x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 4 },
  ],
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parseLayoutItem(item: unknown, validSet: Set<string>, bp: BreakpointName): Layout[number] | null {
  if (!item || typeof (item as { i?: string }).i !== 'string') return null
  const row = item as { i: string; x?: number; y?: number; w?: number; h?: number; minW?: number; minH?: number; maxW?: number; maxH?: number }
  if (!validSet.has(row.i)) return null
  const def = DEFAULT_LAYOUTS[bp].find((d) => d.i === row.i)
  const maxW = COLS[bp]
  return {
    i: row.i,
    x: num(row.x, def?.x ?? 0),
    y: num(row.y, def?.y ?? 0),
    w: num(row.w, def?.w ?? Math.min(6, maxW)),
    h: num(row.h, def?.h ?? 2),
    minW: num(row.minW, 1),
    minH: num(row.minH, 1),
    maxW: num(row.maxW, maxW),
    maxH: num(row.maxH, 4),
  }
}

function loadLayouts(): Record<BreakpointName, Layout> {
  if (typeof window === 'undefined') return { ...DEFAULT_LAYOUTS }
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_KEY)
    if (!raw) return { ...DEFAULT_LAYOUTS }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_LAYOUTS }
    const validSet = new Set(WIDGET_IDS)
    const result = {} as Record<BreakpointName, Layout>
    for (const bp of (['lg', 'md', 'sm', 'xs'] as const)) {
      const arr = parsed[bp]
      if (!Array.isArray(arr)) {
        result[bp] = [...DEFAULT_LAYOUTS[bp]]
        continue
      }
      const items: LayoutItem[] = []
      for (const item of arr) {
        const parsedItem = parseLayoutItem(item, validSet, bp)
        if (parsedItem) items.push(parsedItem)
      }
      const missing = WIDGET_IDS.filter((id) => !items.some((it) => it.i === id))
      if (missing.length) {
        const maxY = items.length ? Math.max(...items.map((it) => it.y + it.h)) : 0
        const cols = COLS[bp]
        missing.forEach((id, idx) => {
          items.push({
            i: id,
            x: 0,
            y: maxY + idx * 2,
            w: Math.min(cols, 6),
            h: 2,
            minW: 1,
            minH: 1,
            maxW: cols,
            maxH: 4,
          })
        })
      }
      result[bp] = (items.length === 4 ? items : [...DEFAULT_LAYOUTS[bp]]) as Layout
    }
    return result
  } catch {
    return { ...DEFAULT_LAYOUTS }
  }
}

function resetLayouts(): void {
  try {
    localStorage.removeItem(DASHBOARD_LAYOUT_KEY)
  } catch {
    // ignore
  }
}

function saveLayouts(layouts: Record<string, Layout>) {
  try {
    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layouts))
  } catch {
    // ignore
  }
}

type Period = 'today' | '7days' | 'week' | 'month' | '30days'

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
  const { locations } = useAdminLocation()
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [period, setPeriod] = useState<Period>('month')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [layouts, setLayouts] = useState<Record<string, Layout>>(() => {
    try {
      return loadLayouts()
    } catch {
      return { lg: DEFAULT_LAYOUTS.lg, md: DEFAULT_LAYOUTS.md, sm: DEFAULT_LAYOUTS.sm, xs: DEFAULT_LAYOUTS.xs }
    }
  })
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1024 })

  const handleLayoutChange = useCallback((_currentLayout: Layout, newLayouts: Partial<Record<string, Layout>>) => {
    setLayouts((prev) => {
      const next: Record<string, Layout> = { ...prev }
      for (const [bp, layout] of Object.entries(newLayouts)) {
        if (layout) next[bp] = layout
      }
      saveLayouts(next)
      return next
    })
  }, [])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 60000)
    return () => clearInterval(interval)
  }, [selectedLocationIds, period])

  async function fetchAnalytics() {
    try {
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      const params = new URLSearchParams()
      params.set('period', period)
      if (selectedLocationIds.length === 1) {
        params.set('locationId', selectedLocationIds[0])
      } else if (selectedLocationIds.length > 1) {
        params.set('locationIds', selectedLocationIds.join(','))
      }
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
              {/* Filter: Standort (Mehrfachauswahl) */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 min-w-[10rem] justify-between">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {selectedLocationIds.length === 0
                          ? 'Alle Standorte'
                          : selectedLocationIds.length === 1
                            ? locations.find((l) => l.id === selectedLocationIds[0])?.name ?? '1 Standort'
                            : `${selectedLocationIds.length} Standorte`}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={selectedLocationIds.length === 0}
                      onCheckedChange={() => setSelectedLocationIds([])}
                    >
                      Alle Standorte
                    </DropdownMenuCheckboxItem>
                    {locations.map((loc) => (
                      <DropdownMenuCheckboxItem
                        key={loc.id}
                        checked={selectedLocationIds.includes(loc.id)}
                        onCheckedChange={(checked) => {
                          setSelectedLocationIds((prev) =>
                            checked ? [...prev, loc.id] : prev.filter((id) => id !== loc.id)
                          )
                        }}
                      >
                        {loc.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
              {/* CTA Küchenansicht */}
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              >
                <Link href="/kitchen/dashboard" className="inline-flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Küchenansicht
                </Link>
              </Button>
              {/* CTA Kassenansicht */}
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30"
              >
                <Link href="/pos" className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Kassenansicht
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
        <section className="mb-6 w-full min-w-0">
          <div ref={containerRef as React.RefObject<HTMLDivElement>} className="w-full min-w-0">
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
                  resetLayouts()
                  setLayouts({ lg: [...DEFAULT_LAYOUTS.lg], md: [...DEFAULT_LAYOUTS.md], sm: [...DEFAULT_LAYOUTS.sm], xs: [...DEFAULT_LAYOUTS.xs] })
                }}
              >
                Layout zurücksetzen
              </Button>
            </div>
            {mounted && width > 0 ? (
              <ResponsiveReactGridLayout
                layouts={layouts}
                onLayoutChange={handleLayoutChange}
                width={width}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={100}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                compactType="vertical"
                isDraggable
                isResizable
                resizeHandles={['se', 's', 'e']}
                className="dashboard-grid w-full"
              >
                {WIDGET_IDS.map((id) => (
                  <div key={id} className="h-full min-h-0 flex flex-col overflow-hidden rounded-2xl">
                    {id === 'orderTrend' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full flex flex-col flex-1 min-h-0">
                          <CardContent className="p-6 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <OrdersAreaChart data={analytics.orderTrend} fillContainer />
                      ) : null)}
                    {id === 'topDishes' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full flex flex-col flex-1 min-h-0">
                          <CardContent className="p-6 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <TopDishesBarChart data={analytics.topDishes} fillContainer />
                      ) : null)}
                    {id === 'statusPie' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full flex flex-col flex-1 min-h-0">
                          <CardContent className="p-6 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <StatusPieChart data={analytics.statusDistribution} fillContainer />
                      ) : null)}
                    {id === 'weekdayBar' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full flex flex-col flex-1 min-h-0">
                          <CardContent className="p-6 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <WeekdayBarChart data={analytics.ordersByWeekday} fillContainer />
                      ) : null)}
                  </div>
                ))}
              </ResponsiveReactGridLayout>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {WIDGET_IDS.map((id) => (
                  <div key={id} className="min-h-[240px]">
                    {id === 'orderTrend' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full">
                          <CardContent className="p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <OrdersAreaChart data={analytics.orderTrend} />
                      ) : null)}
                    {id === 'topDishes' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full">
                          <CardContent className="p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <TopDishesBarChart data={analytics.topDishes} />
                      ) : null)}
                    {id === 'statusPie' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full">
                          <CardContent className="p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <StatusPieChart data={analytics.statusDistribution} />
                      ) : null)}
                    {id === 'weekdayBar' &&
                      (analyticsLoading ? (
                        <Card className="border-border/50 rounded-2xl h-full">
                          <CardContent className="p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Lade Chart…</span>
                          </CardContent>
                        </Card>
                      ) : analytics ? (
                        <WeekdayBarChart data={analytics.ordersByWeekday} />
                      ) : null)}
                  </div>
                ))}
              </div>
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
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              <Link href="/kitchen/dashboard" className="inline-flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Küchenansicht öffnen
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30 hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              <Link href="/pos" className="inline-flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Kassenansicht öffnen
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
