'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AdminLocationProvider } from '@/components/admin/LocationContext'
import { LocationSwitcher } from '@/components/admin/LocationSwitcher'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocationProvider>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="ml-auto flex items-center">
          <LocationSwitcher />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {children}
      </div>
    </AdminLocationProvider>
  )
}
