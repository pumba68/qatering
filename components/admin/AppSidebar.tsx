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
  Wallet,
  Coins,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Pin,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const STORAGE_KEY_PINNED = 'admin-sidebar-pinned-groups'
const STORAGE_KEY_EXPANDED = 'admin-sidebar-expanded'

/** Admin-Sidebar: Option B – Gruppierung mit stabilen IDs für Persistenz. */
const menuGroups = [
  {
    id: 'overview',
    label: 'Übersicht',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'speise',
    label: 'Speise',
    items: [
      { title: 'Gerichte', url: '/admin/dishes', icon: UtensilsCrossed },
      { title: 'Speiseplan', url: '/admin/menu-planner', icon: Calendar },
    ],
  },
  {
    id: 'orders',
    label: 'Bestellungen & Verkauf',
    items: [
      { title: 'Bestellungen', url: '/admin/orders', icon: ShoppingBag },
      { title: 'Metadaten', url: '/admin/metadata', icon: Tags },
      { title: 'Coupons', url: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    items: [
      { title: 'Unternehmen', url: '/admin/companies', icon: Building2 },
      { title: 'Nutzer', url: '/admin/users', icon: Users },
      { title: 'Guthaben aufladen', url: '/admin/wallet/top-up', icon: Coins },
      { title: 'Guthaben verwalten', url: '/admin/wallet/balances', icon: Wallet },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { title: 'Einstellungen', url: '/admin/settings', icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const [hydrated, setHydrated] = React.useState(false)
  const [pinnedGroups, setPinnedGroups] = React.useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    try {
      const rawPinned = localStorage.getItem(STORAGE_KEY_PINNED)
      const rawExpanded = localStorage.getItem(STORAGE_KEY_EXPANDED)
      if (rawPinned) setPinnedGroups(JSON.parse(rawPinned))
      if (rawExpanded) setExpandedGroups(JSON.parse(rawExpanded))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  const isGroupExpanded = React.useCallback(
    (groupId: string) => {
      if (!hydrated) return true
      if (expandedGroups[groupId] !== undefined) return expandedGroups[groupId]
      return pinnedGroups.includes(groupId)
    },
    [hydrated, expandedGroups, pinnedGroups]
  )

  const setGroupExpanded = React.useCallback((groupId: string, open: boolean) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: open }
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const togglePin = React.useCallback((groupId: string) => {
    setPinnedGroups((prev) => {
      const next = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
      try {
        localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: true }
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const isPinned = (groupId: string) => pinnedGroups.includes(groupId)

  React.useEffect(() => {
    if (!hydrated || isCollapsed) return
    const groupWithActive = menuGroups.find((g) =>
      g.items.some(
        (item) =>
          pathname === item.url ||
          (item.url !== '/admin' && pathname.startsWith(item.url))
      )
    )
    if (!groupWithActive) return
    const currentlyExpanded = expandedGroups[groupWithActive.id] ?? pinnedGroups.includes(groupWithActive.id)
    if (!currentlyExpanded) {
      setExpandedGroups((prev) => {
        const next = { ...prev, [groupWithActive.id]: true }
        try {
          localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [pathname, hydrated, isCollapsed, expandedGroups, pinnedGroups])

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

      {/* Navigation: gruppiert, auf-/zuklappbar, mit Pinnen (Variante B) */}
      <SidebarContent className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {menuGroups.map((group) => {
            const groupIsExpanded = isGroupExpanded(group.id)
            const groupHasActiveItem = group.items.some(
              (item) =>
                pathname === item.url ||
                (item.url !== '/admin' && pathname.startsWith(item.url))
            )

            if (isCollapsed) {
              return (
                <div key={group.id} className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.url ||
                      (item.url !== '/admin' && pathname.startsWith(item.url))
                    const linkContent = (
                      <Link
                        key={item.title}
                        href={item.url}
                        className={`flex items-center justify-center gap-3 py-2.5 rounded-lg transition-all duration-200 px-2 ${
                          isActive
                            ? 'bg-white/20 text-white shadow-md'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      </Link>
                    )
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right"><p>{item.title}</p></TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            }

            return (
              <Collapsible
                key={group.id}
                open={groupIsExpanded}
                onOpenChange={(open) => setGroupExpanded(group.id, open)}
                className="group/collapsible"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5 rounded-lg overflow-hidden">
                    <CollapsibleTrigger
                      className={`flex flex-1 items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 text-white/90 hover:bg-white/10 hover:text-white min-w-0 ${
                        groupHasActiveItem ? 'bg-white/5' : ''
                      }`}
                    >
                      {groupIsExpanded ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0 text-white/70" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-white/70" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/80 truncate">
                        {group.label}
                      </span>
                    </CollapsibleTrigger>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            togglePin(group.id)
                            if (!groupIsExpanded) setGroupExpanded(group.id, true)
                          }}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 ${
                            isPinned(group.id)
                              ? 'text-amber-300 hover:bg-white/10'
                              : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                          }`}
                          aria-label={isPinned(group.id) ? 'Gruppe abpinnen' : 'Gruppe anpinnen'}
                        >
                          <Pin
                            className={`w-4 h-4 ${isPinned(group.id) ? 'fill-current' : ''}`}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{isPinned(group.id) ? 'Abpinnen' : 'Anpinnen (dauerhaft aufgeklappt)'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-0.5 pl-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.url ||
                          (item.url !== '/admin' && pathname.startsWith(item.url))
                        const linkContent = (
                          <Link
                            key={item.title}
                            href={item.url}
                            className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 px-3 ${
                              isActive
                                ? 'bg-white/20 text-white shadow-md'
                                : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium whitespace-nowrap truncate">
                              {item.title}
                            </span>
                          </Link>
                        )
                        return linkContent
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
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