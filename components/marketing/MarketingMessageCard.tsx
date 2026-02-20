'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { InAppMessageItem } from '@/hooks/use-in-app-messages'

interface MarketingMessageCardProps {
  message: InAppMessageItem
  onClose?: (messageId: string) => void
  variant?: 'popup' | 'banner' | 'slot'
}

export function MarketingMessageCard({
  message,
  onClose,
  variant = 'banner',
}: MarketingMessageCardProps) {
  const isPopup = variant === 'popup'

  return (
    <Card
      className={
        isPopup
          ? 'rounded-2xl border-border/50 shadow-2xl max-w-md w-full mx-auto'
          : 'rounded-2xl border border-border/50 bg-card/95 hover:shadow-lg transition-all duration-300'
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {message.title && (
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {message.title}
            </h3>
          )}
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => onClose(message.id)}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {message.templateSnapshot?.html ? (
          // Block-Editor template: render pre-built server-side HTML
          <div
            className="text-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: message.templateSnapshot.html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {message.body}
          </p>
        )}
        {message.linkUrl && (
          <a
            href={message.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            Mehr erfahren
          </a>
        )}
      </CardContent>
    </Card>
  )
}
