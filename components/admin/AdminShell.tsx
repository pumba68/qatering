'use client'

import { AdminLocationProvider } from '@/components/admin/LocationContext'
import { LocationSwitcher } from '@/components/admin/LocationSwitcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocationProvider>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LocationSwitcher />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
        {children}
      </div>
    </AdminLocationProvider>
  )
}
