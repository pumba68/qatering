'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

/** Erzwingt Light Mode für den Speiseplan. Stellt beim Unmount die vorherige Einstellung wieder her. */
export function ForceLightMode({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const previousRef = useRef<string | null>(null)

  useEffect(() => {
    if (previousRef.current === null) {
      previousRef.current = theme ?? 'system'
    }
    setTheme('light')
    return () => {
      setTheme(previousRef.current ?? 'system')
    }
  }, [setTheme])

  return <>{children}</>
}
