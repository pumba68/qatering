'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { getWeekNumber, getWeekDays, formatDayName, formatShortDate } from '@/lib/week-utils'
import { formatCurrency, formatDateToKey, formatDate } from '@/lib/utils'
import { DraggableDish } from '@/components/menu/DraggableDish'
import { DroppableDayCard } from '@/components/menu/DroppableDayCard'
import { DraggableMenuItem } from '@/components/menu/DraggableMenuItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, Utensils, Calendar, Plus, Search, Trophy } from 'lucide-react'
import { useToast } from '@chakra-ui/react'

interface Dish {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  dietTags: string[]
}

interface MenuItem {
  id: string
  dishId: string
  date: string
  price: string
  maxOrders: number | null
  available: boolean
  dish: Dish
}

interface Menu {
  id: string
  weekNumber: number
  year: number
  isPublished: boolean
  menuItems: MenuItem[]
}

export default function MenuPlannerPage() {
  const locationId = 'demo-location-1'
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const currentYear = today.getFullYear()

  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [top5Dishes, setTop5Dishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showDishSelector, setShowDishSelector] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTargetDayKey, setSheetTargetDayKey] = useState<string | null>(null)
  const [selectedDishIdForDay, setSelectedDishIdForDay] = useState<string | null>(null)
  const [dishSearch, setDishSearch] = useState('')
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedDish, setDraggedDish] = useState<Dish | null>(null)
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null)
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)
  const toast = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /** Beim Ziehen eines Gerichts (dish-*) zählt die ganze Tag-Spalte: Tag-Droppable hat Vorrang vor Sortable-Items. */
  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id)
    if (activeId.startsWith('dish-')) {
      const underPointer = pointerWithin(args)
      const dayId = underPointer.find(({ id }) => String(id).startsWith('day-'))
      if (dayId) return [dayId]
    }
    return closestCenter(args)
  }

  useEffect(() => {
    loadSettings()
    loadMenu()
    loadDishes()
    loadTop5Dishes()
  }, [selectedWeek, selectedYear, locationId])

  async function loadSettings() {
    try {
      const response = await fetch(`/api/admin/settings?locationId=${locationId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkingDays(data.workingDays || [1, 2, 3, 4, 5])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Settings:', error)
      setWorkingDays([1, 2, 3, 4, 5])
    }
  }

  async function loadMenu() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/menus?locationId=${locationId}&year=${selectedYear}`
      )
      
      if (!response.ok) {
        console.error('Fehler beim Abrufen der Menüs')
        return null
      }

      const menus = await response.json()

      if (!Array.isArray(menus)) {
        console.error('API returned non-array:', menus)
        return null
      }
      
      const foundMenu = menus.find(
        (m: Menu) => m.weekNumber === selectedWeek && m.year === selectedYear
      )

      if (foundMenu) {
        setMenu(foundMenu)
        return foundMenu
      } else {
        const createResponse = await fetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId,
            weekNumber: selectedWeek,
            year: selectedYear,
            isPublished: false,
          }),
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}))
          console.error('Fehler beim Erstellen des Menüs:', errorData)
          if (errorData?.error) {
            toast({
              title: 'Fehler',
              description: errorData.error,
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          }
          return null
        }
        
        const newMenu = await createResponse.json()
        setMenu(newMenu)
        return newMenu
      }
    } catch (error) {
      console.error('Fehler beim Laden des Menüs:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function loadDishes() {
    try {
      const response = await fetch('/api/admin/dishes')
      const data = await response.json()
      setDishes(data.filter((d: Dish & { isActive: boolean }) => d.isActive))
    } catch (error) {
      console.error('Fehler beim Laden der Gerichte:', error)
    }
  }

  async function loadTop5Dishes() {
    try {
      const response = await fetch('/api/admin/dishes?sort=popular&limit=5')
      const data = await response.json()
      setTop5Dishes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fehler beim Laden der Top-5-Gerichte:', error)
      setTop5Dishes([])
    }
  }

  async function addDishToDay(dishId: string, dayDate: Date) {
    if (!menu) {
      const loadedMenu = await loadMenu()
      if (!loadedMenu || !loadedMenu.id) {
        toast({
          title: 'Fehler',
          description: 'Menü konnte nicht geladen werden.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }
      const currentMenu = loadedMenu
      const defaultPrice = 8.50
      const menuId = currentMenu.id
      
      if (!menuId) {
        alert('Menü-ID fehlt. Bitte Seite neu laden.')
        return
      }

      const requestBody = {
        menuId: menuId,
        dishId,
        date: dayDate.toISOString(),
        price: defaultPrice,
        maxOrders: 50,
        available: true,
      }
      
      const response = await fetch('/api/admin/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || 'Fehler beim Hinzufügen')
      }
      
      loadMenu()
      setShowDishSelector(null)
      setSheetOpen(false)
      setSheetTargetDayKey(null)
      setSelectedDishIdForDay(null)
      return
    }

    try {
      let currentMenu: Menu | null = menu
      
      if (currentMenu && 'error' in currentMenu) {
        currentMenu = null
      }
      
      if (!currentMenu?.id) {
        currentMenu = await loadMenu()
        
        if (currentMenu && 'error' in currentMenu) {
          toast({
            title: 'Fehler',
            description: `Fehler beim Laden des Menüs: ${(currentMenu as any).error || 'Unbekannter Fehler'}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          return
        }
        
        if (!currentMenu?.id) {
          toast({
            title: 'Fehler',
            description: 'Menü konnte nicht geladen werden. Bitte Seite neu laden.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          return
        }
      }

      const defaultPrice = 8.50
      const menuId = currentMenu.id
      
      if (!menuId) {
        alert('Menü-ID fehlt. Bitte Seite neu laden.')
        return
      }

      const requestBody = {
        menuId: menuId,
        dishId,
        date: dayDate.toISOString(),
        price: defaultPrice,
        maxOrders: 50,
        available: true,
      }
      
      const response = await fetch('/api/admin/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.error || 'Fehler beim Hinzufügen'
        console.error('API Error:', errorData)
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('MenuItem erfolgreich erstellt:', result)
      
      await loadMenu()
      setShowDishSelector(null)
      setSheetOpen(false)
      setSheetTargetDayKey(null)
      setSelectedDishIdForDay(null)
      toast({
        title: 'Erfolg',
        description: 'Gericht erfolgreich hinzugefügt',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Fehler in addDishToDay:', error)
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Hinzufügen des Gerichts',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function removeMenuItem(itemId: string) {
    if (!window.confirm('Möchten Sie dieses Gericht entfernen?')) return

    try {
      const response = await fetch(`/api/admin/menus/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Fehler beim Entfernen')
      
      loadMenu()
      toast({
        title: 'Erfolg',
        description: 'Gericht erfolgreich entfernt',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Entfernen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function updateMenuItemPrice(itemId: string, newPrice: number) {
    try {
      const response = await fetch(`/api/admin/menus/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      
      loadMenu()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren des Preises',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function moveMenuItemToDay(itemId: string, newDayDate: Date) {
    try {
      const response = await fetch(`/api/admin/menus/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDayDate.toISOString() }),
      })

      if (!response.ok) throw new Error('Fehler beim Verschieben')
      
      loadMenu()
      toast({
        title: 'Erfolg',
        description: 'Gericht erfolgreich verschoben',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Verschieben des Gerichts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveId(active.id as string)
    setSheetOpen(false)

    const activeIdStr = active.id as string
    const dishId = activeIdStr.replace('dish-', '')
    const dish = dishes.find(d => d.id === dishId)
    if (dish) {
      setDraggedDish(dish)
    } else {
      const menuItem = menu?.menuItems?.find(item => item.id === active.id)
      if (menuItem) {
        setDraggedDish(menuItem.dish)
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (over && typeof over.id === 'string' && over.id.startsWith('day-')) {
      const dayKey = over.id.replace('day-', '')
      setDragOverDayKey(dayKey)
    } else {
      setDragOverDayKey(null)
    }
  }

  function handleDragCancel() {
    setActiveId(null)
    setDraggedDish(null)
    setDragOverDayKey(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setDraggedDish(null)
    setDragOverDayKey(null)

    if (!over) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    if (activeIdStr.startsWith('dish-')) {
      const dishId = activeIdStr.replace('dish-', '')
      
      if (overIdStr.startsWith('day-')) {
        const dayKey = overIdStr.replace('day-', '')
        
        const dayItems = itemsByDay[dayKey] || []
        const dishAlreadyExists = dayItems.some(item => item.dishId === dishId)
        
        if (dishAlreadyExists) {
          toast({
            title: 'Hinweis',
            description: 'Dieses Gericht ist bereits an diesem Tag vorhanden',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })
          return
        }
        
        const [year, month, day] = dayKey.split('-').map(Number)
        const dayDate = new Date(year, month - 1, day, 12, 0, 0, 0)
        await addDishToDay(dishId, dayDate)
      }
      return
    }

    if (overIdStr.startsWith('day-')) {
      const menuItem = menu?.menuItems.find(item => item.id === activeIdStr)
      if (menuItem) {
        const dayKey = overIdStr.replace('day-', '')
        const currentDayKey = formatDateToKey(new Date(menuItem.date))
        
        if (dayKey === currentDayKey) {
          return
        }
        
        const dayItems = itemsByDay[dayKey] || []
        const dishAlreadyExists = dayItems.some(item => item.dishId === menuItem.dishId)
        
        if (dishAlreadyExists) {
          toast({
            title: 'Hinweis',
            description: 'Dieses Gericht ist bereits an diesem Tag vorhanden',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })
          return
        }
        
        const [year, month, day] = dayKey.split('-').map(Number)
        const newDayDate = new Date(year, month - 1, day, 12, 0, 0, 0)
        await moveMenuItemToDay(menuItem.id, newDayDate)
      }
    }
  }

  async function togglePublish() {
    if (!menu) return

    try {
      const response = await fetch(`/api/admin/menus/${menu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !menu.isPublished }),
      })

      if (!response.ok) throw new Error('Fehler')
      
      loadMenu()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Veröffentlichen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const weekDays = getWeekDays(selectedWeek, selectedYear)
  const weekStartDate = weekDays[0]
  const weekEndDate = weekDays[weekDays.length - 1]
  
  const workingWeekDays = weekDays.filter((day) => {
    const dayOfWeek = day.getDay()
    return workingDays.includes(dayOfWeek)
  })

  const itemsByDay: Record<string, MenuItem[]> = (menu?.menuItems || []).reduce((acc, item) => {
    const dayKey = formatDateToKey(new Date(item.date))
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

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

  return (
    <div className="space-y-6">
      {/* Header mit Navigation - ähnlich MenuWeek, aber komprimierter */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-3xl -z-10">
          <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z" fill="currentColor" className="text-green-50 dark:text-green-950/20" />
          </svg>
        </div>
        
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-primary" />
                Speiseplan-Editor
              </h1>
              <p className="text-muted-foreground text-sm">
                KW {selectedWeek} / {selectedYear} • {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/dishes">
                  <Utensils className="w-4 h-4 mr-2" />
                  Gerichte verwalten
                </Link>
              </Button>
              {menu && (
                <Button
                  onClick={togglePublish}
                  variant={menu.isPublished ? 'default' : 'secondary'}
                  size="sm"
                  className={menu.isPublished ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {menu.isPublished ? '✅ Veröffentlicht' : '📝 Als Entwurf'}
                </Button>
              )}
            </div>
          </div>

          {/* Wochen-Navigation: kompakt, lesbar, mit direktem KW-Sprung (DESIGN_GUIDELINES) */}
          {(() => {
            const sameMonth = weekStartDate.getMonth() === weekEndDate.getMonth()
            const weekRangeLabel = sameMonth
              ? `${weekStartDate.getDate()}.–${weekEndDate.getDate()}. ${new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(weekStartDate)} ${selectedYear}`
              : `${weekStartDate.getDate()}. ${new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(weekStartDate)} – ${weekEndDate.getDate()}. ${new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(weekEndDate)} ${selectedYear}`
            const isCurrentWeek = selectedWeek === currentWeek && selectedYear === currentYear
            return (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Button
                  onClick={() => navigateWeek('prev')}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-border/60 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 hover:scale-105 active:scale-95 transition-transform shrink-0"
                  aria-label="Vorherige Woche"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <DropdownMenu open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-white/90 dark:bg-gray-800/90 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all min-w-[180px] sm:min-w-[220px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                      aria-label="Kalenderwoche wählen"
                    >
                      <span className="text-base font-bold text-foreground">KW {selectedWeek}</span>
                      <span className="text-sm text-muted-foreground">{weekRangeLabel}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64 p-4 rounded-xl border-border/50 shadow-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="nav-kw" className="text-sm font-medium text-foreground">KW</label>
                        <Input
                          id="nav-kw"
                          type="number"
                          min={1}
                          max={53}
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(Math.min(53, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-20 h-9 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="nav-year" className="text-sm font-medium text-foreground">Jahr</label>
                        <Input
                          id="nav-year"
                          type="number"
                          min={2020}
                          max={2100}
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Math.min(2100, Math.max(2020, parseInt(e.target.value) || currentYear)))}
                          className="w-24 h-9 rounded-lg"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md"
                        onClick={() => setWeekPickerOpen(false)}
                      >
                        Übernehmen
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => navigateWeek('next')}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-border/60 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 hover:scale-105 active:scale-95 transition-transform shrink-0"
                  aria-label="Nächste Woche"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>

                {!isCurrentWeek && (
                  <Button
                    onClick={() => {
                      setSelectedWeek(currentWeek)
                      setSelectedYear(currentYear)
                    }}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl bg-white/90 dark:bg-gray-800/90 border border-border/50 shadow-sm hover:shadow-md font-medium shrink-0"
                  >
                    Aktuelle Woche
                  </Button>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Menü wird geladen...</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="space-y-6">
            {/* Schnellzugriff: Top-5-Ranking (DESIGN_GUIDELINES: Sektion abgehoben, Gamification) */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-yellow-50/90 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 dark:from-amber-600 dark:via-orange-500 dark:to-amber-600" />
              <div className="relative p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Top 5 – Beliebteste Gerichte
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Ziehen Sie einen Favoriten in einen Wochentag
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSheetTargetDayKey(null)
                      setSelectedDishIdForDay(null)
                      setSheetOpen(true)
                    }}
                    size="sm"
                    className="flex-shrink-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Alle Gerichte
                  </Button>
                </div>
                <div className="flex flex-wrap items-stretch gap-4 overflow-x-auto pb-1">
                  {(top5Dishes.length > 0 ? top5Dishes : dishes.slice(0, 5)).map((dish, index) => {
                    const rank = index + 1
                    const rankStyles = rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-500/50'
                      : rank === 2
                        ? 'bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-slate-100 shadow-md'
                        : rank === 3
                          ? 'bg-amber-700 text-amber-100 shadow-md'
                          : 'bg-muted text-muted-foreground'
                    return (
                      <div
                        key={dish.id}
                        className="group flex-shrink-0 w-[150px] rounded-2xl overflow-hidden border border-border/50 bg-card transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-grab active:cursor-grabbing"
                      >
                        <div className="relative flex flex-col h-full p-4 space-y-3">
                          <div className={`absolute top-3 left-3 z-10 flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${rankStyles}`}>
                            {rank}
                          </div>
                          <div className="pt-6 flex-1 min-h-0">
                            <DraggableDish dish={dish} />
                          </div>
                          <div className="flex justify-center border-t border-border/50 pt-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Platz {rank}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Swimlanes: Tage horizontal – Breite dynamisch je nach Anzahl Werktage */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-6 min-w-0 w-full">
                {workingWeekDays.map((day) => {
                  const dayKey = formatDateToKey(day)
                  const dayItems = itemsByDay[dayKey] || []
                  const isDragOver = dragOverDayKey === dayKey
                  const draggedDishId = draggedDish?.id || null

                  return (
                    <div
                      key={dayKey}
                      className="flex-1 min-w-[180px] rounded-2xl overflow-hidden border border-border/50 bg-muted/30 transition-all"
                    >
                      <DroppableDayCard
                        day={day}
                        dayKey={dayKey}
                        items={dayItems}
                        onRemoveItem={removeMenuItem}
                        onUpdatePrice={updateMenuItemPrice}
                        onAddDishClick={() => {
                          setSheetTargetDayKey(dayKey)
                          setSelectedDishIdForDay(null)
                          setSheetOpen(true)
                        }}
                        showDishSelector={false}
                        dishes={dishes}
                        onDishSelect={(dishId, dayDate) => {
                          const dk = formatDateToKey(dayDate)
                          const existing = itemsByDay[dk] || []
                          if (existing.some((item) => item.dishId === dishId)) {
                            toast({
                              title: 'Hinweis',
                              description: 'Dieses Gericht ist bereits an diesem Tag vorhanden',
                              status: 'warning',
                              duration: 3000,
                              isClosable: true,
                            })
                            return
                          }
                          addDishToDay(dishId, dayDate).catch(console.error)
                        }}
                        draggedDishId={draggedDishId}
                        isDragOver={isDragOver}
                        insertDishMode={!!selectedDishIdForDay}
                        onInsertDishClick={
                          selectedDishIdForDay
                            ? () => {
                                const existing = itemsByDay[dayKey] || []
                                if (existing.some((item) => item.dishId === selectedDishIdForDay)) {
                                  toast({
                                    title: 'Hinweis',
                                    description: 'Dieses Gericht ist bereits an diesem Tag vorhanden',
                                    status: 'warning',
                                    duration: 3000,
                                    isClosable: true,
                                  })
                                  return
                                }
                                addDishToDay(selectedDishIdForDay, day).catch(console.error)
                              }
                            : undefined
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && draggedDish ? (
              <Card className="opacity-90 shadow-xl rounded-2xl border border-border/50">
                <CardContent className="p-3">
                  <p className="font-medium text-sm text-foreground">{draggedDish.name}</p>
                </CardContent>
              </Card>
            ) : activeId && menu ? (
              (() => {
                const menuItem = menu.menuItems.find((item) => item.id === activeId)
                return menuItem ? (
                  <Card className="opacity-90 shadow-xl rounded-2xl border border-border/50">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-foreground">{menuItem.dish.name}</p>
                    </CardContent>
                  </Card>
                ) : null
              })()
            ) : null}
          </DragOverlay>

          {/* Sheet: Alle Gerichte – innerhalb DndContext, damit Drag aus dem Sheet funktioniert */}
          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open)
              if (!open) {
                setSheetTargetDayKey(null)
                setSelectedDishIdForDay(null)
                setDishSearch('')
              }
            }}
          >
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-foreground">
                  Gericht aus Katalog wählen
                </SheetTitle>
                {sheetTargetDayKey ? (
                  <p className="text-sm text-muted-foreground">
                    Klicken oder in einen Tag ziehen.
                  </p>
                ) : selectedDishIdForDay ? (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Klicken Sie auf einen Tag im Plan: „Hier einfügen“
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Gericht wählen, dann Tag anklicken – oder in einen Tag ziehen.
                  </p>
                )}
              </SheetHeader>
              <div className="mt-4 flex flex-col flex-1 min-h-0">
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Gerichte durchsuchen..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="pl-9 rounded-lg border-border/50"
                  />
                </div>
                <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1">
                  {dishes
                    .filter(
                      (d) =>
                        !dishSearch.trim() ||
                        d.name.toLowerCase().includes(dishSearch.trim().toLowerCase())
                    )
                    .map((dish) => (
                      <div
                        key={dish.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (sheetTargetDayKey) {
                            const day = workingWeekDays.find(
                              (d) => formatDateToKey(d) === sheetTargetDayKey
                            )
                            if (day) {
                              const existing = itemsByDay[sheetTargetDayKey] || []
                              if (existing.some((item) => item.dishId === dish.id)) {
                                toast({
                                  title: 'Hinweis',
                                  description: 'Dieses Gericht ist bereits an diesem Tag vorhanden',
                                  status: 'warning',
                                  duration: 3000,
                                  isClosable: true,
                                })
                                return
                              }
                              addDishToDay(dish.id, day).catch(console.error)
                            }
                          } else {
                            setSelectedDishIdForDay(dish.id)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            ;(e.currentTarget as HTMLDivElement).click()
                          }
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <DraggableDish dish={dish} />
                      </div>
                    ))}
                  {dishes.filter(
                    (d) =>
                      !dishSearch.trim() ||
                      d.name.toLowerCase().includes(dishSearch.trim().toLowerCase())
                  ).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      Keine Gerichte gefunden
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </DndContext>
      )}
    </div>
  )
}
