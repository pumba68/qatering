import { requireRole } from '@/lib/auth-helpers'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminShell>{children}</AdminShell>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
