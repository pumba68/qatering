'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight, UtensilsCrossed, ChefHat } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const MENU_LOCATION_STORAGE_KEY = 'menu-selected-location-id'

interface LocationOption {
  id: string
  name: string
  address?: string | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

export default function HomePage() {
  const router = useRouter()
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const stored = (() => {
          try { return localStorage.getItem(MENU_LOCATION_STORAGE_KEY) } catch { return null }
        })()

        const res = await fetch('/api/public/locations')
        if (!res.ok) throw new Error('API error')
        const data: LocationOption[] = await res.json()

        if (cancelled) return

        // Gespeicherte Location noch gültig → direkt weiterleiten
        if (stored && data.some((l) => l.id === stored)) {
          setRedirecting(true)
          router.replace(`/menu?locationId=${stored}`)
          return
        }

        // Nur eine Location → direkt weiterleiten
        if (data.length === 1) {
          setRedirecting(true)
          try { localStorage.setItem(MENU_LOCATION_STORAGE_KEY, data[0].id) } catch { /* ignore */ }
          router.replace(`/menu?locationId=${data[0].id}`)
          return
        }

        setLocations(data)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [router])

  const handleSelect = (loc: LocationOption) => {
    try { localStorage.setItem(MENU_LOCATION_STORAGE_KEY, loc.id) } catch { /* ignore */ }
    router.push(`/menu?locationId=${loc.id}`)
  }

  // Loading / Redirect-State
  if (loading || redirecting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-green-50/40 dark:to-green-950/10 flex flex-col items-center justify-center px-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error / Empty-State
  if (error || locations.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-green-50/40 dark:to-green-950/10 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Keine Kantinen verfügbar</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Derzeit sind keine aktiven Kantinen eingerichtet. Bitte versuche es später erneut.
        </p>
      </div>
    )
  }

  // Location Picker
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-green-50/40 dark:to-green-950/10 relative overflow-hidden">
      {/* Dezente Hintergrundeffekte */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-16 w-72 h-72 bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-24 left-12 w-96 h-96 bg-emerald-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10 md:py-16 max-w-5xl">
        {/* Header */}
        <motion.div
          className="text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-xl mb-5">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Wähle deine Kantine
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Tippe auf eine Kantine, um den aktuellen Speiseplan zu sehen.
          </p>
        </motion.div>

        {/* Card Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {locations.map((loc) => (
            <motion.div key={loc.id} variants={cardVariants}>
              <Card
                className="group relative overflow-hidden border border-border/60 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 cursor-pointer bg-card"
                onClick={() => handleSelect(loc)}
              >
                {/* Hover-Akzentstreifen oben */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors duration-300">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-foreground text-base leading-snug mb-0.5 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                        {loc.name}
                      </h2>
                      {loc.address && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                          {loc.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm group-hover:shadow-md transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(loc)
                    }}
                  >
                    Speiseplan ansehen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Hint */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          Speiseplan ansehen ist ohne Anmeldung möglich · Zum Bestellen bitte{' '}
          <a href="/login" className="underline underline-offset-2 hover:text-foreground transition-colors">
            einloggen
          </a>
        </motion.p>
      </div>
    </div>
  )
}
