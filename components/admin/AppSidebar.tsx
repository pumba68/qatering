'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Calendar,
  Settings,
  Tags,
  Ticket,
  LogOut,
  Building2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Gerichte',
    url: '/admin/dishes',
    icon: UtensilsCrossed,
  },
  {
    title: 'Speiseplan',
    url: '/admin/menu-planner',
    icon: Calendar,
  },
  {
    title: 'Metadaten',
    url: '/admin/metadata',
    icon: Tags,
  },
  {
    title: 'Coupons',
    url: '/admin/coupons',
    icon: Ticket,
  },
  {
    title: 'Unternehmen',
    url: '/admin/companies',
    icon: Building2,
  },
  {
    title: 'Nutzer',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Einstellungen',
    url: '/admin/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar 
      collapsible="icon" 
      className="admin-sidebar-purple"
      style={isCollapsed ? { '--sidebar-width-icon': '4.5rem' } as React.CSSProperties : undefined}
    >
      {/* Header mit Logo/Branding */}
      <SidebarHeader className="px-4 pt-6 pb-4 border-b-0">
        <Link 
          href="/admin" 
          className={`flex items-center gap-3 group transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 shrink-0">
            <span className="text-2xl">🍳</span>
          </div>
          <span className={`text-white font-semibold text-lg whitespace-nowrap transition-all ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            Kantine Platform
          </span>
        </Link>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider delayDuration={0}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url || 
                           (item.url !== '/admin' && pathname.startsWith(item.url))
            
            const linkContent = (
              <Link
                key={item.title}
                href={item.url}
                className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-2' : 'px-3'
                } ${
                  isActive
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-all ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>
                  {item.title}
                </span>
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </TooltipProvider>
      </SidebarContent>

      {/* Footer mit Log Out */}
      <SidebarFooter className="px-2 pb-4 border-t-0">
        <TooltipProvider delayDuration={0}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center justify-center px-3 py-2.5 w-full rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Abmelden</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Abmelden</span>
            </button>
          )}
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  )
}