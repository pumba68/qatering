'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Card,
  CardBody,
  VStack,
  Box,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react'
import { DraggableMenuItem } from './DraggableMenuItem'
import { formatDayName, formatShortDate } from '@/lib/week-utils'

interface MenuItem {
  id: string
  dishId: string
  date: string
  price: string
  maxOrders: number | null
  available: boolean
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }
}

interface DroppableDayCardProps {
  day: Date
  dayKey: string
  items: MenuItem[]
  onRemoveItem: (itemId: string) => void
  onUpdatePrice: (itemId: string, price: number) => void
  onAddDishClick: () => void
  showDishSelector: boolean
  dishes?: Array<{
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }>
  onDishSelect?: (dishId: string, day: Date) => void
  draggedDishId?: string | null
  isDragOver?: boolean
}

export function DroppableDayCard({
  day,
  dayKey,
  items,
  onRemoveItem,
  onUpdatePrice,
  onAddDishClick,
  showDishSelector,
  dishes,
  onDishSelect,
  draggedDishId,
  isDragOver,
}: DroppableDayCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayKey}`,
    data: {
      type: 'day',
      dayKey,
      day,
    },
  })

  const itemIds = items.map((item) => item.id)
  
  // Prüfe ob das gezogene Gericht bereits an diesem Tag vorhanden ist
  const dishAlreadyExists = draggedDishId
    ? items.some(item => item.dishId === draggedDishId)
    : false
  
  // Bestimme die visuellen Styles basierend auf dem Zustand
  const getCardStyles = () => {
    if (!isOver && !isDragOver) {
      return {
        bg: undefined,
        borderWidth: '1px',
        borderColor: undefined,
      }
    }
    
    if (dishAlreadyExists) {
      // Rot wenn Gericht bereits vorhanden
      return {
        bg: 'red.50',
        _dark: { bg: 'red.900' },
        borderWidth: '2px',
        borderColor: 'red.300',
      }
    }
    
    // Blau wenn Drop erlaubt
    return {
      bg: 'blue.50',
      _dark: { bg: 'blue.900' },
      borderWidth: '2px',
      borderColor: 'blue.300',
    }
  }

  const cardStyles = getCardStyles()

  return (
    <Card
      ref={setNodeRef}
      minH="400px"
      bg={cardStyles.bg}
      _dark={cardStyles._dark}
      borderWidth={cardStyles.borderWidth}
      borderColor={cardStyles.borderColor}
      transition="all 0.2s"
      position="relative"
    >
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Box>
            <Heading size="md">{formatDayName(day)}</Heading>
            <Text fontSize="sm" color="gray.600">
              {formatShortDate(day)}
            </Text>
          </Box>

          <VStack spacing={2} align="stretch" mb={3} minH="200px">
            {items.length > 0 ? (
              <SortableContext
                items={itemIds}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <DraggableMenuItem
                    key={item.id}
                    item={item}
                    onRemove={onRemoveItem}
                    onPriceUpdate={onUpdatePrice}
                  />
                ))}
              </SortableContext>
            ) : (
              <Box
                p={4}
                textAlign="center"
                color={dishAlreadyExists ? 'red.500' : 'gray.400'}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={dishAlreadyExists ? 'red.300' : 'gray.300'}
                borderRadius="md"
                bg={dishAlreadyExists ? 'red.50' : undefined}
                _dark={{ bg: dishAlreadyExists ? 'red.900' : undefined }}
              >
                <Text fontSize="sm" fontWeight={dishAlreadyExists ? 'bold' : 'normal'}>
                  {dishAlreadyExists
                    ? 'Gericht bereits vorhanden!'
                    : 'Gericht hierher ziehen'}
                </Text>
              </Box>
            )}
          </VStack>

          <Button
            onClick={onAddDishClick}
            colorScheme="blue"
            variant="outline"
            size="sm"
          >
            + Gericht hinzufügen
          </Button>

          {showDishSelector && dishes && dishes.length > 0 && (
            <Box
              mt={3}
              p={3}
              bg="gray.50"
              _dark={{ bg: 'gray.800' }}
              borderRadius="md"
              borderWidth="1px"
              maxH="240px"
              overflowY="auto"
            >
              <VStack spacing={1} align="stretch">
                {dishes.map((dish) => (
                  <Button
                    key={dish.id}
                    onClick={() => {
                      if (onDishSelect) {
                        onDishSelect(dish.id, day)
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                  >
                    {dish.name}
                  </Button>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
