'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'admin-selected-location-id'

export interface LocationOption {
  id: string
  name: string
}

interface LocationContextValue {
  selectedId: string | 'all'
  setSelectedId: (id: string | 'all') => void
  /** Für Seiten, die genau einen Standort brauchen (z. B. Menüplaner, Einstellungen): bei "Alle" wird die erste Location genutzt. */
  effectiveLocationId: string | null
  locations: LocationOption[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function useAdminLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useAdminLocation must be used within AdminLocationProvider')
  return ctx
}

export function AdminLocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedIdState] = useState<string | 'all'>(() => {
    if (typeof window === 'undefined') return 'all'
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s === 'all' || s === '' || s == null ? 'all' : s
    } catch {
      return 'all'
    }
  })

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/locations')
      if (!res.ok) throw new Error('Standorte konnten nicht geladen werden.')
      const data = await res.json()
      setLocations(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const setSelectedId = useCallback((id: string | 'all') => {
    setSelectedIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }, [])

  const effectiveLocationId =
    selectedId === 'all'
      ? locations.length > 0
        ? locations[0].id
        : null
      : selectedId

  const value: LocationContextValue = {
    selectedId,
    setSelectedId,
    effectiveLocationId,
    locations,
    loading,
    error,
    refetch: fetchLocations,
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}
