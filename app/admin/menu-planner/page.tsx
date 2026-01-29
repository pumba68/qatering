'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
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
import { ChevronLeft, ChevronRight, Utensils, Calendar, Plus, Search } from 'lucide-react'
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
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-2xl -z-10">
          <svg className="absolute bottom-0 w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
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
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">KW:</label>
                <Input
                  type="number"
                  min={1}
                  max={53}
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Jahr:</label>
                <Input
                  type="number"
                  min={2020}
                  max={2100}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentYear)}
                  className="w-24 h-8"
                />
              </div>
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
                  Aktuelle Woche
                </Button>
              )}
            </div>

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
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="space-y-6">
            {/* Schnellzugriff: Top 5 + Alle Gerichte (DESIGN_GUIDELINES: gap-6) */}
            <Card className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  Schnellzugriff
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Beliebte Gerichte in einen Tag ziehen oder alle Gerichte durchsuchen
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4 overflow-x-auto py-2">
                {(top5Dishes.length > 0 ? top5Dishes : dishes.slice(0, 5)).map((dish) => (
                  <div
                    key={dish.id}
                    className="flex-shrink-0 w-[140px] rounded-xl border border-border/50 overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <DraggableDish dish={dish} />
                  </div>
                ))}
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
              </CardContent>
            </Card>

            {/* Swimlanes: Tage horizontal (min-width 220px, gap-6) */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-6 min-w-0" style={{ minWidth: 'min-content' }}>
                {workingWeekDays.map((day) => {
                  const dayKey = formatDateToKey(day)
                  const dayItems = itemsByDay[dayKey] || []
                  const isDragOver = dragOverDayKey === dayKey
                  const draggedDishId = draggedDish?.id || null

                  return (
                    <div
                      key={dayKey}
                      className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden border border-border/50 bg-muted/30 transition-all"
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
