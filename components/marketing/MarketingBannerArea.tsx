'use client'

import { useSession } from 'next-auth/react'
import { useInAppMessages } from '@/hooks/use-in-app-messages'
import { MarketingMessageCard } from './MarketingMessageCard'
import { Skeleton } from '@/components/ui/skeleton'

interface MarketingBannerAreaProps {
  /** Seite: menu | wallet | dashboard – zeigt BANNER-Nachrichten für diese Seite */
  displayPlace: 'menu' | 'wallet' | 'dashboard'
}

/**
 * Rendert In-App-Nachrichten als Banner/Karte (displayType=BANNER) für die angegebene Seite.
 */
export function MarketingBannerArea({ displayPlace }: MarketingBannerAreaProps) {
  const { data: session, status } = useSession()
  const { messages, isLoading, markRead } = useInAppMessages('BANNER', displayPlace)

  if (status !== 'authenticated' || !session?.user) return null
  const list = Array.isArray(messages) ? messages : []
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  }
  if (list.length === 0) return null

  return (
    <section
      className="space-y-3"
      aria-label="Aktuelle Hinweise"
    >
      {list.map((msg) => (
        <MarketingMessageCard
          key={msg.id}
          message={msg}
          onClose={markRead}
          variant="banner"
        />
      ))}
    </section>
  )
}
