'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Theme wechseln">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9"
      aria-label={`${theme === 'dark' ? 'Hell' : 'Dunkel'} Modus aktivieren`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 transition-transform hover:rotate-90" />
      ) : (
        <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
      )}
    </Button>
  )
}