'use client'

import { useSession } from 'next-auth/react'
import { useInAppMessages } from '@/hooks/use-in-app-messages'
import { MarketingMessageCard } from './MarketingMessageCard'
import { Skeleton } from '@/components/ui/skeleton'

interface MarketingSlotAreaProps {
  /** Slot-ID z. B. menu_top, wallet_top, dashboard_hero */
  slotId: string
}

/**
 * Rendert In-App-Nachrichten für einen dynamischen Slot (displayType=SLOT, slotId).
 */
export function MarketingSlotArea({ slotId }: MarketingSlotAreaProps) {
  const { data: session, status } = useSession()
  const { messages, isLoading, markRead } = useInAppMessages('SLOT', undefined, slotId)

  if (status !== 'authenticated' || !session?.user) return null
  const list = Array.isArray(messages) ? messages : []
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }
  if (list.length === 0) return null

  return (
    <section
      className="space-y-3"
      aria-label="Aktuelle Nachrichten"
    >
      {list.map((msg) => (
        <MarketingMessageCard
          key={msg.id}
          message={msg}
          onClose={markRead}
          variant="slot"
        />
      ))}
    </section>
  )
}
