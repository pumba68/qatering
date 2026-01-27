'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Calendar,
  Settings,
  Tags,
  Ticket,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
    description: 'Übersicht & Bestellungen',
  },
  {
    title: 'Gerichte',
    url: '/admin/dishes',
    icon: UtensilsCrossed,
    description: 'Gerichte verwalten',
  },
  {
    title: 'Speiseplan',
    url: '/admin/menu-planner',
    icon: Calendar,
    description: 'Wochenplan erstellen',
  },
  {
    title: 'Metadaten',
    url: '/admin/metadata',
    icon: Tags,
    description: 'Kategorien & Allergene',
  },
  {
    title: 'Coupons',
    url: '/admin/coupons',
    icon: Ticket,
    description: 'Gutscheine & Aktionen',
  },
  {
    title: 'Einstellungen',
    url: '/admin/settings',
    icon: Settings,
    description: 'Werktage & Konfiguration',
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-xl">🍳</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Admin Panel</span>
                  <span className="text-xs">Kantine Verwaltung</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url || 
                               (item.url !== '/admin' && pathname.startsWith(item.url))
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-center px-2 py-1.5">
              <span className="text-xs text-muted-foreground">
                Kantine Platform v0.1.0
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}