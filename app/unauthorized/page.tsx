import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kein Zugriff</h1>
          <p className="text-muted-foreground mt-2">
            Sie haben keine Berechtigung für diese Seite. Melden Sie sich mit einem Konto an, das Admin- oder Küchenrechte hat.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">Zur Startseite</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
