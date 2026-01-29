'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, formatDateToKey } from '@/lib/utils'
import { getWeekNumber, getWeekStartDate } from '@/lib/week-utils'
import MenuItemCard from './MenuItemCard'
import { PromotionBannerCarousel } from './PromotionBannerCarousel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Utensils, Leaf, Sparkles } from 'lucide-react'

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

      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50 p-0">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      ) : !menu || menu.menuItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-10 md:p-14 text-center shadow-lg"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
            <Utensils className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Kein Menüplan für diese Woche</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Schau nächste Woche wieder vorbei – dann gibt es wieder leckere Gerichte für dich.</p>
        </motion.div>
      ) : sortedDates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-10 md:p-14 text-center shadow-lg"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
            <Utensils className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Keine Gerichte in dieser Woche</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Für diese Woche sind noch keine Gerichte geplant. Wechsle die Woche oder schau später nochmal.</p>
        </motion.div>
      ) : (
        <Tabs
          value={selectedDate || sortedDates[0]}
          onValueChange={(value) => setSelectedDate(value)}
          className="w-full"
        >
          {/* Eine runde Karte: Header + Tage-Switch */}
          <div className="rounded-3xl overflow-hidden border border-border/50 bg-card shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/25 dark:via-emerald-950/25 dark:to-teal-950/25 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm items-center justify-center shadow-sm shrink-0">
                    <span className="text-xl" aria-hidden>🥗</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">Menü der Woche</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      KW {selectedWeek} • {formatDate(weekStartDate)} – {formatDate(weekEndDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    onClick={() => navigateWeek('prev')}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/60 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Vorherige</span>
                  </Button>
                  {(selectedWeek !== currentWeek || selectedYear !== currentYear) && (
                    <Button
                      onClick={() => { setSelectedWeek(currentWeek); setSelectedYear(currentYear) }}
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md"
                    >
                      Diese Woche
                    </Button>
                  )}
                  <Button
                    onClick={() => navigateWeek('next')}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/60 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                  >
                    <span className="hidden sm:inline mr-1">Nächste</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t border-border/50 bg-muted/30 dark:bg-muted/20 px-4 py-4 md:px-5 md:py-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Tag wählen</p>
              <div className="rounded-2xl bg-background/80 dark:bg-background/60 border border-border/50 shadow-inner p-1.5 overflow-x-auto">
                <TabsList className="w-full justify-start gap-1 h-auto p-0 bg-transparent border-0 shadow-none min-h-0">
                  {sortedDates.map((dateKey) => {
                    const [y, m, d] = dateKey.split('-').map(Number)
                    const date = new Date(y, m - 1, d)
                    const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' })
                    const dayNumber = date.getDate()
                    const isToday = dateKey === todayKeyLocal
                    const itemCount = itemsByDate[dateKey]?.length || 0
                    const isActive = dateKey === (selectedDate || sortedDates[0])
                    return (
                      <TabsTrigger
                        key={dateKey}
                        value={dateKey}
                        className="flex-1 min-w-[72px] max-w-[100px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl font-medium transition-all duration-200 hover:bg-muted/80 data-[state=inactive]:bg-transparent py-3 px-2 border-0"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] uppercase tracking-wide opacity-80">{dayName}</span>
                          <span className="text-base font-bold tabular-nums">{dayNumber}</span>
                          {itemCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-white/25 text-white' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}>
                              {itemCount}
                            </span>
                          )}
                          {isToday && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/30 text-white' : 'bg-primary/15 text-primary'}`}>
                              Heute
                            </span>
                          )}
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
            </div>
          </div>

          {/* Gerichte für ausgewählten Tag */}
          {sortedDates.map((dateKey) => {
              const [y, m, d] = dateKey.split('-').map(Number)
              const date = new Date(y, m - 1, d)
              const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' })
              const formattedDate = formatDate(date)
              const dayItems = itemsByDate[dateKey] || []

              const veganCount = dayItems.filter((i) => i.dish?.dietTags?.some((t) => t?.toLowerCase().includes('vegan'))).length
              const veggieCount = dayItems.filter((i) => i.dish?.dietTags?.some((t) => t?.toLowerCase().includes('vegetarisch'))).length
              const promoCount = dayItems.filter((i) => i.isPromotion).length

              return (
                <TabsContent key={dateKey} value={dateKey} className="mt-6 focus-visible:outline-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={dateKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-foreground">
                          {dayName}, {formattedDate}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {dayItems.length} Gericht{dayItems.length !== 1 ? 'e' : ''}
                        </span>
                        {(veganCount > 0 || veggieCount > 0 || promoCount > 0) && (
                          <div className="flex items-center gap-2 flex-wrap ml-auto">
                            {veganCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                <Leaf className="w-3 h-3" />
                                {veganCount} vegan
                              </span>
                            )}
                            {veggieCount > 0 && !veganCount && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                <Leaf className="w-3 h-3" />
                                {veggieCount} vegetarisch
                              </span>
                            )}
                            {promoCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                <Sparkles className="w-3 h-3" />
                                {promoCount} Aktion
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {dayItems.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-10 text-center"
                        >
                          <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                          <p className="text-muted-foreground font-medium">Keine Gerichte für diesen Tag</p>
                          <p className="text-sm text-muted-foreground mt-1">Wähle einen anderen Tag oder eine andere Woche.</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
                            hidden: {},
                          }}
                        >
                          {dayItems
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((item, index) => {
                              const cartItem = cart.find(c => c.menuItemId === item.id)
                              return (
                                <motion.div
                                  key={item.id}
                                  variants={{
                                    hidden: { opacity: 0, y: 16 },
                                    visible: { opacity: 1, y: 0 },
                                  }}
                                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                  <MenuItemCard
                                    item={item}
                                    quantity={cartItem?.quantity || 0}
                                    onSelect={(item, quantity) => {
                                      onSelectItem?.(item, quantity)
                                    }}
                                    onQuantityChange={onQuantityChange}
                                  />
                                </motion.div>
                              )
                            })}
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              )
            })}
        </Tabs>
      )}
    </div>
  )
}
