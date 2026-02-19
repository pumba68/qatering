'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react'

export interface PromotionBannerItem {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  couponCode?: string | null
  couponName?: string | null
}

interface PromotionBannerCarouselProps {
  banners: PromotionBannerItem[]
  weekNumber: number
  year: number
  locationId?: string
}

const STORAGE_KEY_PREFIX = 'promo-banner-closed'

function getStorageKey(weekNumber: number, year: number, locationId?: string): string {
  return locationId
    ? `${STORAGE_KEY_PREFIX}-${locationId}-${weekNumber}-${year}`
    : `${STORAGE_KEY_PREFIX}-${weekNumber}-${year}`
}

export function PromotionBannerCarousel({
  banners,
  weekNumber,
  year,
  locationId,
}: PromotionBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [closed, setClosed] = useState(false)

  const storageKey = getStorageKey(weekNumber, year, locationId)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null
      setClosed(raw === '1')
    } catch {
      setClosed(false)
    }
  }, [storageKey])

  const handleClose = useCallback(() => {
    setClosed(true)
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      // ignore
    }
  }, [storageKey])

  const goPrev = () => {
    setCurrentIndex((i) => (i <= 0 ? banners.length - 1 : i - 1))
  }

  const goNext = () => {
    setCurrentIndex((i) => (i >= banners.length - 1 ? 0 : i + 1))
  }

  if (!banners.length || closed) return null

  const banner = banners[currentIndex]
  if (!banner) return null

  return (
    <section
      className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 shadow-lg"
      aria-label="Aktuelle Aktion / Motto-Woche"
    >
      {/* Schließen-Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Banner schließen"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="relative flex items-center min-h-[120px] md:min-h-[140px]">
        {/* Hintergrundbild (optional) */}
        {banner.imageUrl ? (
          <div className="absolute inset-0">
            <img
              src={banner.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          </div>
        )}

        {/* Inhalt */}
        <div className="relative z-[1] flex-1 flex items-center justify-between gap-4 px-6 py-6 md:py-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-sm line-clamp-2">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="mt-1 text-sm md:text-base text-muted-foreground line-clamp-1">
                {banner.subtitle}
              </p>
            )}
            {banner.couponCode && (
              <p className="mt-2 text-sm font-medium text-primary">
                Gutscheincode: <code className="bg-primary/10 px-1.5 py-0.5 rounded">{banner.couponCode}</code>
              </p>
            )}
          </div>

          {/* Karussell-Steuerung (nur bei mehreren Bannern) */}
          {banners.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/80 dark:bg-gray-800/80 border-border/60"
                onClick={goPrev}
                aria-label="Vorheriges Banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1.5" role="tablist" aria-label="Banner auswählen">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === currentIndex}
                    aria-label={`Banner ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === currentIndex
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                    }`}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/80 dark:bg-gray-800/80 border-border/60"
                onClick={goNext}
                aria-label="Nächstes Banner"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
