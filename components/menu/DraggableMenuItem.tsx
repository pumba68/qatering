'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Card,
  CardBody,
  Flex,
  Text,
  Input,
  HStack,
  Badge,
  IconButton,
} from '@chakra-ui/react'

interface DraggableMenuItemProps {
  item: {
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
  onRemove: (itemId: string) => void
  onPriceUpdate: (itemId: string, price: number) => void
}

export function DraggableMenuItem({
  item,
  onRemove,
  onPriceUpdate,
}: DraggableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'menuItem',
      item,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="sm"
      variant="outline"
      {...attributes}
      {...listeners}
    >
      <CardBody p={3}>
        <Flex justify="space-between" align="start" mb={2}>
          <Text fontWeight="medium" fontSize="sm" flex={1}>
            {item.dish.name}
          </Text>
          <IconButton
            aria-label="Gericht entfernen"
            icon={<Text>✕</Text>}
            size="xs"
            colorScheme="red"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
          />
        </Flex>
        <HStack spacing={2}>
          <Input
            type="number"
            step="0.1"
            value={parseFloat(item.price)}
            onChange={(e) => {
              e.stopPropagation()
              onPriceUpdate(item.id, parseFloat(e.target.value))
            }}
            onClick={(e) => e.stopPropagation()}
            w="80px"
            size="sm"
          />
          <Text fontSize="xs" color="gray.600">
            €
          </Text>
        </HStack>
        {item.dish.dietTags.length > 0 && (
          <HStack spacing={1} mt={2} flexWrap="wrap">
            {item.dish.dietTags.slice(0, 2).map((tag) => (
              <Badge key={tag} colorScheme="green" fontSize="xs">
                {tag}
              </Badge>
            ))}
          </HStack>
        )}
      </CardBody>
    </Card>
  )
}
