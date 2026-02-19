'use client'

import { useSession } from 'next-auth/react'
import { useInAppMessages } from '@/hooks/use-in-app-messages'
import { MarketingMessageCard } from './MarketingMessageCard'
import { useState } from 'react'

/**
 * Zeigt die erste ungelesene Popup-Nachricht als Modal.
 * Nur für eingeloggte Kunden (Rolle CUSTOMER); ruft Mark-as-read beim Schließen auf.
 * Wird nur auf der Menü-Seite gerendert (Kunden-Einstieg nach Login).
 */
export function MarketingPopupContainer() {
  const { data: session, status } = useSession()
  const { messages, markRead } = useInAppMessages('POPUP')
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const list = Array.isArray(messages) ? messages : []
  const unreadPopups = list.filter((m) => !m.read && !dismissedIds.has(m.id))
  const current = unreadPopups[0]

  const handleClose = async (messageId: string) => {
    setDismissedIds((prev) => new Set(prev).add(messageId))
    await markRead(messageId)
  }

  const role = (session?.user as { role?: string } | undefined)?.role
  if (status !== 'authenticated' || !session?.user || role !== 'CUSTOMER') return null
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Marketing-Nachricht"
    >
      <div className="relative w-full max-w-lg">
        <MarketingMessageCard
          message={current}
          onClose={handleClose}
          variant="popup"
        />
      </div>
    </div>
  )
}
