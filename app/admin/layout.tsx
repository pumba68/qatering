import { requireRole } from '@/lib/auth-helpers'
import { AppSidebar } from '@/components/admin/AppSidebar'
import { AdminShell } from '@/components/admin/AdminShell'
import { Toaster } from 'sonner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['ADMIN', 'KITCHEN_STAFF', 'SUPER_ADMIN'])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminShell>{children}</AdminShell>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
