'use client'

import { useCallback, useEffect, useState } from 'react'

export interface InAppMessageItem {
  id: string
  title: string | null
  body: string
  linkUrl: string | null
  displayPlace: string
  displayType?: string
  slotId?: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  segment: { id: string; name: string }
  read: boolean
}

export function useInAppMessages(
  displayType?: 'POPUP' | 'BANNER' | 'SLOT',
  displayPlace?: string,
  slotId?: string | null
) {
  const [messages, setMessages] = useState<InAppMessageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (displayType) params.set('displayType', displayType)
      if (displayPlace) params.set('displayPlace', displayPlace)
      if (slotId) params.set('slotId', slotId)
      const res = await fetch(`/api/in-app-messages?${params.toString()}`)
      if (!res.ok) {
        setMessages([])
        return
      }
      const data = await res.json().catch(() => [])
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [displayType, displayPlace, slotId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const markRead = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/in-app-messages/${messageId}/read`, { method: 'POST' })
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      )
    } catch {
      // optimistic: remove from list so popup closes
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }, [])

  return { messages, isLoading, markRead, refetch: fetchMessages }
}
