'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { getWeekNumber, getWeekStartDate, getWeekDays } from '@/lib/week-utils'
import MenuItemCard from './MenuItemCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MenuItem {
  id: string
  date: string
  price: number
  available: boolean
  currentOrders: number
  maxOrders: number | null
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
  }
}

interface Menu {
  id: string
  weekNumber: number
  year: number
  startDate: string
  endDate: string
  menuItems: MenuItem[]
}

interface MenuWeekProps {
  locationId: string
  onSelectItem?: (item: MenuItem) => void
}

export default function MenuWeek({ locationId, onSelectItem }: MenuWeekProps) {
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const currentYear = today.getFullYear()

  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMenu()
  }, [locationId, selectedWeek, selectedYear])

  async function fetchMenu() {
    try {
      setLoading(true)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/menu/MenuWeek.tsx:58',message:'Fetching menu from API',data:{locationId,selectedWeek,selectedYear},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const response = await fetch(`/api/menus?locationId=${locationId}&weekNumber=${selectedWeek}&year=${selectedYear}`)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/menu/MenuWeek.tsx:49',message:'API response status',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/menu/MenuWeek.tsx:52',message:'API error response',data:{status:response.status,error:errorData.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw new Error(errorData.error || 'Menü nicht gefunden')
      }
      const data = await response.json()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/menu/MenuWeek.tsx:56',message:'Menu data received',data:{menuId:data.id,weekNumber:data.weekNumber,isPublished:data.isPublished,menuItemsCount:data.menuItems?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setMenu(data)
      setError(null) // Reset error state on successful load
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/menu/MenuWeek.tsx:59',message:'Error in fetchMenu',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      setMenu(null) // Clear menu state on error
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedWeek === 1) {
        setSelectedWeek(52)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedWeek(selectedWeek - 1)
      }
    } else {
      if (selectedWeek === 52) {
        setSelectedWeek(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedWeek(selectedWeek + 1)
      }
    }
  }

  // Erstelle Wochen-Grid basierend auf verfügbaren Tagen
  const weekStartDate = getWeekStartDate(selectedWeek, selectedYear)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)

  // Gruppiere MenuItems nach Datum
  const itemsByDate = (menu?.menuItems || []).reduce((acc, item) => {
    const itemDate = new Date(item.date)
    const dateKey = itemDate.toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div className="space-y-6">
      {/* Header mit Navigation */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <Button
            onClick={() => navigateWeek('prev')}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Vorherige Woche
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Essensplan KW {selectedWeek} / {selectedYear}
          </h2>
          <Button
            onClick={() => navigateWeek('next')}
            variant="outline"
            size="sm"
          >
            Nächste Woche
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
        </p>
        {(selectedWeek !== currentWeek || selectedYear !== currentYear) && (
          <Button
            onClick={() => {
              setSelectedWeek(currentWeek)
              setSelectedYear(currentYear)
            }}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            Zur aktuellen Woche
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Menü wird geladen...</div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      ) : !menu || menu.menuItems.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
          Kein Menüplan für diese Woche verfügbar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(itemsByDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([dateKey, items]) => {
              const itemDate = new Date(dateKey)
              return (
                <Card key={dateKey} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-lg">
                      {itemDate.toLocaleDateString('de-DE', {
                        weekday: 'long',
                      })}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {itemDate.toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 space-y-3">
                    {items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onSelect={() => onSelectItem?.(item)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
