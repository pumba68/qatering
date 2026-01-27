'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  IconButton,
  useToast,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react'
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
import { formatCurrency } from '@/lib/utils'
import { DraggableDish } from '@/components/menu/DraggableDish'
import { DroppableDayCard } from '@/components/menu/DroppableDayCard'
import { DraggableMenuItem } from '@/components/menu/DraggableMenuItem'

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
  const locationId = 'demo-location-1' // Demo - später aus Auth/Context
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const currentYear = today.getFullYear()

  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showDishSelector, setShowDishSelector] = useState<string | null>(null) // dayKey
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]) // Default: Mo-Fr
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedDish, setDraggedDish] = useState<Dish | null>(null)
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null)
  const toast = useToast()

  // Sensoren für Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mindest-Distanz bevor Drag startet (verhindert versehentliches Dragging)
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
      // Fallback zu Default-Werten
      setWorkingDays([1, 2, 3, 4, 5])
    }
  }

  async function loadMenu() {
    try {
      setLoading(true)
      // Versuche Menü zu laden oder erstelle es
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
        // Menü erstellen
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

  async function addDishToDay(dishId: string, dayDate: Date) {
    if (!menu) {
      // Try to load menu first
      const loadedMenu = await loadMenu()
      if (!loadedMenu || !loadedMenu.id) {
        toast({
          title: 'Fehler',
          description: 'Menü konnte nicht geladen werden. Bitte stellen Sie sicher, dass die Datenbank geseedet wurde (npm run db:seed).',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }
      // Menu is now loaded, continue with loadedMenu
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
      return
    }

    try {
      // Ensure menu.id exists - if not, reload menu first
      let currentMenu: Menu | null = menu
      
      // Check if menu is an error object
      if (currentMenu && 'error' in currentMenu) {
        currentMenu = null
      }
      
      if (!currentMenu?.id) {
        currentMenu = await loadMenu()
        
        // Check if loaded menu is still an error
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
            duration: 3000,
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
      
      // Lade Menü neu, um die Änderungen zu sehen
      await loadMenu()
      setShowDishSelector(null)
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
    
    // Prüfe ob es ein Gericht aus der Liste ist
    const activeIdStr = active.id as string
    const dishId = activeIdStr.replace('dish-', '')
    const dish = dishes.find(d => d.id === dishId)
    if (dish) {
      setDraggedDish(dish)
    } else {
      // Wenn es ein MenuItem ist, hole das Gericht
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

    // Wenn es ein Gericht aus der Liste war (dish-xxx)
    if (activeIdStr.startsWith('dish-')) {
      const dishId = activeIdStr.replace('dish-', '')
      
      // Prüfe ob über einem Tag-Dropzone gedroppt wurde
      if (overIdStr.startsWith('day-')) {
        const dayKey = overIdStr.replace('day-', '')
        
        // Prüfe ob das Gericht bereits an diesem Tag vorhanden ist
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
        
        // Parse dayKey (YYYY-MM-DD) als lokales Datum (Mitternacht)
        const [year, month, day] = dayKey.split('-').map(Number)
        const dayDate = new Date(year, month - 1, day, 0, 0, 0, 0)
        await addDishToDay(dishId, dayDate)
      }
      return
    }

    // Wenn es ein MenuItem war (verschieben zwischen Tagen)
    if (overIdStr.startsWith('day-')) {
      const menuItem = menu?.menuItems.find(item => item.id === activeIdStr)
      if (menuItem) {
        const dayKey = overIdStr.replace('day-', '')
        const currentDayKey = new Date(menuItem.date).toISOString().split('T')[0]
        
        // Prüfe ob es derselbe Tag ist
        if (dayKey === currentDayKey) {
          return // Keine Aktion nötig, bereits am richtigen Tag
        }
        
        // Prüfe ob das Gericht bereits am Zieltag vorhanden ist
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
        
        // Parse dayKey (YYYY-MM-DD) als lokales Datum (Mitternacht)
        const [year, month, day] = dayKey.split('-').map(Number)
        const newDayDate = new Date(year, month - 1, day, 0, 0, 0, 0)
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
      alert('Fehler')
    }
  }

  const weekDays = getWeekDays(selectedWeek, selectedYear)
  
  // Filtere nur die Werktage
  const workingWeekDays = weekDays.filter((day) => {
    const dayOfWeek = day.getDay() // 0=Sonntag, 1=Montag, ..., 6=Samstag
    return workingDays.includes(dayOfWeek)
  })

  const itemsByDay: Record<string, MenuItem[]> = (menu?.menuItems || []).reduce((acc, item) => {
    const dayKey = new Date(item.date).toISOString().split('T')[0]
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Speiseplan-Editor</Heading>
          <HStack spacing={4}>
            <Button as={Link} href="/admin/dishes" colorScheme="gray" variant="outline">
              Gerichte verwalten
            </Button>
            {menu && (
              <Button
                onClick={togglePublish}
                colorScheme={menu.isPublished ? 'green' : 'blue'}
              >
                {menu.isPublished ? '✅ Veröffentlicht' : '📝 Als Entwurf'}
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Woche auswählen */}
        <Card mb={6}>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Text fontWeight="medium" fontSize="sm">
                Kalenderwoche:
              </Text>
              <Input
                type="number"
                min={1}
                max={53}
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
                w="80px"
                size="md"
              />
              <Text fontWeight="medium" fontSize="sm">
                Jahr:
              </Text>
              <Input
                type="number"
                min={2020}
                max={2100}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentYear)}
                w="100px"
                size="md"
              />
              <Button
                onClick={() => {
                  setSelectedWeek(currentWeek)
                  setSelectedYear(currentYear)
                }}
                size="sm"
                variant="outline"
              >
                Aktuelle Woche
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SimpleGrid columns={{ base: 1, md: 2, lg: workingWeekDays.length + 1 }} spacing={4}>
              {/* Gerichte-Liste (Drag Source) */}
              <Card minH="400px" position="sticky" top={4}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Heading size="md">Gerichte</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Ziehen Sie Gerichte zu den Tagen
                      </Text>
                    </Box>
                    <Box
                      maxH="500px"
                      overflowY="auto"
                      p={2}
                      bg="gray.50"
                      _dark={{ bg: 'gray.800' }}
                      borderRadius="md"
                    >
                      <VStack spacing={1} align="stretch">
                        {dishes.length === 0 ? (
                          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                            Keine Gerichte verfügbar
                          </Text>
                        ) : (
                          dishes.map((dish) => (
                            <DraggableDish key={dish.id} dish={dish} />
                          ))
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Tage mit Dropzones */}
              {workingWeekDays.map((day) => {
                const dayKey = day.toISOString().split('T')[0]
                const dayItems = itemsByDay[dayKey] || []
                const isDragOver = dragOverDayKey === dayKey
                const draggedDishId = draggedDish?.id || null

                return (
                  <DroppableDayCard
                    key={dayKey}
                    day={day}
                    dayKey={dayKey}
                    items={dayItems}
                    onRemoveItem={removeMenuItem}
                    onUpdatePrice={updateMenuItemPrice}
                    onAddDishClick={() =>
                      setShowDishSelector(showDishSelector === dayKey ? null : dayKey)
                    }
                    showDishSelector={showDishSelector === dayKey}
                    dishes={dishes}
                    onDishSelect={(dishId, dayDate) => {
                      // Prüfe auch hier auf Duplikate
                      const dayItems = itemsByDay[dayDate.toISOString().split('T')[0]] || []
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
                      
                      addDishToDay(dishId, dayDate).catch((error) => {
                        console.error('Fehler in addDishToDay:', error)
                      })
                    }}
                    draggedDishId={draggedDishId}
                    isDragOver={isDragOver}
                  />
                )
              })}
            </SimpleGrid>

            {/* Drag Overlay für visuelles Feedback */}
            <DragOverlay>
              {activeId && draggedDish ? (
                <Card size="sm" variant="outline" opacity={0.8} boxShadow="lg">
                  <CardBody p={3}>
                    <Text fontWeight="medium" fontSize="sm">
                      {draggedDish.name}
                    </Text>
                  </CardBody>
                </Card>
              ) : activeId && menu ? (
                (() => {
                  const menuItem = menu.menuItems.find(item => item.id === activeId)
                  return menuItem ? (
                    <Card size="sm" variant="outline" opacity={0.8} boxShadow="lg">
                      <CardBody p={3}>
                        <Text fontWeight="medium" fontSize="sm">
                          {menuItem.dish.name}
                        </Text>
                      </CardBody>
                    </Card>
                  ) : null
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Dish Selector Modal (als Fallback) */}
        {showDishSelector && (
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            p={6}
            borderRadius="lg"
            boxShadow="xl"
            zIndex={1000}
            maxW="400px"
            w="90%"
            maxH="80vh"
            overflowY="auto"
          >
            <VStack spacing={2} align="stretch">
              <Heading size="sm" mb={2}>Gericht hinzufügen</Heading>
              {dishes.map((dish) => (
                <Button
                  key={dish.id}
                  onClick={() => {
                    const dayKey = showDishSelector
                    const day = workingWeekDays.find(
                      d => d.toISOString().split('T')[0] === dayKey
                    )
                    if (day) {
                      addDishToDay(dish.id, day).catch((error) => {
                        console.error('Fehler in addDishToDay:', error)
                      })
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                >
                  {dish.name}
                </Button>
              ))}
              <Button
                mt={4}
                onClick={() => setShowDishSelector(null)}
                variant="outline"
                size="sm"
              >
                Schließen
              </Button>
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  )
}
