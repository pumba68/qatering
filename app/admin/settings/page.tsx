'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

/**
 * PROJ-26: Die Werktage-Konfiguration ist jetzt direkt am Standort unter
 * /admin/locations/[id] zu finden. Diese Seite leitet den Admin dorthin.
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Standort-Konfiguration</p>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Werktage werden jetzt direkt am Standort gepflegt.
              </p>
              <p className="text-sm text-muted-foreground">
                Öffnungszeiten und aktive Wochentage können individuell pro Standort
                unter <strong>Standorte → Standort bearbeiten</strong> konfiguriert werden.
              </p>
              <Link href="/admin/locations">
                <Button size="sm" variant="outline" className="mt-1 gap-2">
                  <MapPin className="h-4 w-4" />
                  Zur Standort-Verwaltung
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
