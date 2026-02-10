'use client'

import React, { useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminLocation } from '@/components/admin/LocationContext'

export function LocationSwitcher() {
  const { selectedId, setSelectedId, locations, loading, error } = useAdminLocation()

  useEffect(() => {
    if (loading || error || locations.length === 0) return
    const current = selectedId === 'all' ? null : locations.find((l) => l.id === selectedId)
    if (selectedId !== 'all' && current === undefined && locations.length > 0) {
      setSelectedId('all')
    }
  }, [loading, error, locations, selectedId, setSelectedId])

  const label =
    selectedId === 'all'
      ? 'Alle Standorte'
      : locations.find((l) => l.id === selectedId)?.name ?? 'Alle Standorte'

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <MapPin className="h-4 w-4" />
        <span className="hidden sm:inline">Standort…</span>
      </Button>
    )
  }

  if (error || locations.length === 0) {
    return (
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {error || 'Keine Standorte'}
      </span>
    )
  }

  if (locations.length === 1) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        <span>{locations[0].name}</span>
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-w-[10rem] justify-between">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuRadioGroup value={selectedId} onValueChange={(v) => setSelectedId(v as string | 'all')}>
          <DropdownMenuRadioItem value="all">Alle Standorte</DropdownMenuRadioItem>
          {locations.map((loc) => (
            <DropdownMenuRadioItem key={loc.id} value={loc.id}>
              {loc.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
