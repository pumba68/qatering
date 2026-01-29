'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calendar } from 'lucide-react'

export default function MenuPlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Menu-Planner Fehler:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <CardTitle>Fehler beim Laden des Speiseplan-Editors</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut oder setzen Sie das Dashboard-Layout
            zurück (falls Sie zuvor Widgets verschoben haben).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} variant="default">
              Erneut versuchen
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">
                <Calendar className="w-4 h-4 mr-2" />
                Zum Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
