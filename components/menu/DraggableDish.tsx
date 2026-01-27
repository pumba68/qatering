'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button, Box, Text } from '@chakra-ui/react'

interface DraggableDishProps {
  dish: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    dietTags: string[]
  }
}

export function DraggableDish({ dish }: DraggableDishProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `dish-${dish.id}`,
    data: {
      type: 'dish',
      dish,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <Button
        variant="ghost"
        size="sm"
        justifyContent="flex-start"
        w="100%"
        isDisabled={isDragging}
      >
        <Text fontSize="sm">{dish.name}</Text>
      </Button>
    </Box>
  )
}
