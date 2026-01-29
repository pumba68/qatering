'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatDateToKey } from '@/lib/utils'
import { getWeekNumber, getWeekStartDate, getWeekDays } from '@/lib/week-utils'
import MenuItemCard from './MenuItemCard'
import { PromotionBannerCarousel } from './PromotionBannerCarousel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MenuItem {
  id: string
  date: string
  price: number
  available: boolean
  currentOrders: number
  maxOrders: number | null
  isPromotion?: boolean
  promotionPrice?: number | string | null
  promotionLabel?: string | null
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
    calories?: number | null
    dietTags?: string[]
    allergens?: string[]
  }
}

interface PromotionBannerItem {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
}

interface Menu {
  id: string
  weekNumber: number
  year: number
  startDate: string
  endDate: string
  menuItems: MenuItem[]
  promotionBanners?: PromotionBannerItem[]
}

interface CartItem {
  menuItemId: string
  quantity: number
}

interface MenuWeekProps {
  locationId: string
  onSelectItem?: (item: MenuItem, quantity?: number) => void
  cart?: CartItem[]
  onQuantityChange?: (menuItemId: string, quantity: number) => void
}

export default function MenuWeek({ locationId, onSelectItem, cart = [], onQuantityChange }: MenuWeekProps) {
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const currentYear = today.getFullYear()

  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchMenu()
  }, [locationId, selectedWeek, selectedYear])

  async function fetchMenu() {
    try {
      setLoading(true)
      const response = await fetch(`/api/menus?locationId=${locationId}&weekNumber=${selectedWeek}&year=${selectedYear}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Menü nicht gefunden')
      }
      const data = await response.json()
      setMenu(data)
      setError(null) // Reset error state on successful load
      
      // Setze Standard-Tag: Heute (lokal), wenn verfügbar, sonst ersten verfügbaren Tag
      if (data.menuItems && data.menuItems.length > 0) {
        const todayLocal = formatDateToKey(new Date())
        const todayItem = data.menuItems.find((item: { date: string }) => {
          const itemDate = new Date(item.date)
          return itemDate.toISOString().split('T')[0] === todayLocal
        })
        
        if (todayItem) {
          setSelectedDate(todayLocal)
        } else {
          // Ersten verfügbaren Tag nehmen
          const firstItem = data.menuItems[0]
          const firstDate = new Date(firstItem.date)
          setSelectedDate(firstDate.toISOString().split('T')[0])
        }
      }
    } catch (err) {
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

  // Gruppiere MenuItems nach Datum (UTC-Kalendertag, da Speicherung 12:00 UTC)
  const itemsByDate = (menu?.menuItems || []).reduce((acc, item) => {
    const itemDate = new Date(item.date)
    const dateKey = itemDate.toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Heute in lokaler Zeitzone (für „Heute“-Markierung und initialen Tab)
  const todayKeyLocal = formatDateToKey(new Date())

  // Sortiere die Tage chronologisch
  const sortedDates = Object.keys(itemsByDate).sort((a, b) => a.localeCompare(b))

  // Gefilterte Items basierend auf ausgewähltem Tag
  const filteredItems = selectedDate && itemsByDate[selectedDate] 
    ? itemsByDate[selectedDate] 
    : []

  return (
    <div className="space-y-8">
      {/* Promotion-Banner (Motto-Woche) oberhalb des Speiseplans – Karussell bei mehreren */}
      {menu?.promotionBanners && menu.promotionBanners.length > 0 && (
        <PromotionBannerCarousel
          banners={menu.promotionBanners}
          weekNumber={selectedWeek}
          year={selectedYear}
          locationId={locationId}
        />
      )}

      {/* Header mit Navigation - HelloFresh Stil */}
      <div className="relative">
        {/* Wellenförmiger Hintergrund */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-3xl -z-10">
          <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z" fill="currentColor" className="text-green-50 dark:text-green-950/20" />
          </svg>
        </div>
        
        <div className="relative px-6 py-8 md:py-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                Das Menü der Woche
              </h1>
              <p className="text-muted-foreground text-lg">
                KW {selectedWeek} / {selectedYear} • {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
              </p>
            </div>
            
            {/* Icon rechts oben */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-2xl">🥗</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button
              onClick={() => navigateWeek('prev')}
              variant="outline"
              size="sm"
              className="hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Vorherige Woche
            </Button>
            
            {(selectedWeek !== currentWeek || selectedYear !== currentYear) && (
              <Button
                onClick={() => {
                  setSelectedWeek(currentWeek)
                  setSelectedYear(currentYear)
                }}
                variant="secondary"
                size="sm"
                className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
              >
                Zur aktuellen Woche
              </Button>
            )}

            <Button
              onClick={() => navigateWeek('next')}
              variant="outline"
              size="sm"
              className="hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              Nächste Woche
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
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
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-xl p-6 text-yellow-700 dark:text-yellow-400 text-center">
          <p className="text-lg font-medium">Kein Menüplan für diese Woche verfügbar.</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-xl p-6 text-yellow-700 dark:text-yellow-400 text-center">
          <p className="text-lg font-medium">Keine Gerichte für diese Woche verfügbar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs für Wochentage */}
          <Tabs 
            value={selectedDate || sortedDates[0]} 
            onValueChange={(value) => setSelectedDate(value)}
            className="w-full"
          >
            <TabsList className="w-full justify-start bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1.5 h-auto rounded-2xl border border-border/50 shadow-sm overflow-x-auto">
              {sortedDates.map((dateKey) => {
                // Kalenderdatum aus Key als lokales Datum parsen (vermeidet Zeitzonen-Verschiebung bei Anzeige)
                const [y, m, d] = dateKey.split('-').map(Number)
                const date = new Date(y, m - 1, d)
                const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' })
                const dayNumber = date.getDate()
                const isToday = dateKey === todayKeyLocal
                const itemCount = itemsByDate[dateKey]?.length || 0
                
                return (
                  <TabsTrigger
                    key={dateKey}
                    value={dateKey}
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-5 py-3 rounded-xl font-medium transition-all hover:bg-accent min-w-[80px] data-[state=active]:scale-105"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-normal uppercase tracking-wide">{dayName}</span>
                      <span className="text-lg font-bold">{dayNumber}</span>
                      {itemCount > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          dateKey === selectedDate 
                            ? 'bg-white/20 text-white' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {itemCount}
                        </span>
                      )}
                      {isToday && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          dateKey === selectedDate 
                            ? 'bg-white/30 text-white' 
                            : 'text-primary'
                        }`}>
                          Heute
                        </span>
                      )}
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Gerichte für ausgewählten Tag */}
            {sortedDates.map((dateKey) => {
              const [y, m, d] = dateKey.split('-').map(Number)
              const date = new Date(y, m - 1, d)
              const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' })
              const formattedDate = formatDate(date)
              const dayItems = itemsByDate[dateKey] || []

              return (
                <TabsContent key={dateKey} value={dateKey} className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      {dayName}, {formattedDate}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dayItems.length} Gericht{dayItems.length !== 1 ? 'e' : ''} verfügbar
                    </p>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="bg-muted/50 rounded-xl p-8 text-center border border-border">
                      <p className="text-muted-foreground">Keine Gerichte für diesen Tag verfügbar.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      {dayItems
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((item) => {
                          const cartItem = cart.find(c => c.menuItemId === item.id)
                          return (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              quantity={cartItem?.quantity || 0}
                              onSelect={(item, quantity) => {
                                onSelectItem?.(item, quantity)
                              }}
                              onQuantityChange={onQuantityChange}
                            />
                          )
                        })}
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}
    </div>
  )
}
