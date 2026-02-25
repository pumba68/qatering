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
  Users2,
  Wallet,
  Coins,
  ShoppingBag,
  MapPin as Pin,
  Megaphone,
  Mail,
  Zap,
  Receipt,
  LayoutTemplate,
  BellRing,
  CreditCard,
  GitBranch,
  ChevronRight,
  BarChart2,
  Utensils,
  TrendingUp,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/* ─── Data ─────────────────────────────────────────────────────────────── */

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
}

interface NavGroup {
  id: string
  label: string
  icon: React.ElementType
  /** Direct link (no flyout, e.g. Dashboard) */
  directUrl?: string
  items?: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    directUrl: '/admin',
  },
  {
    id: 'betrieb',
    label: 'Betrieb',
    icon: Utensils,
    items: [
      { title: 'Gerichte', url: '/admin/dishes', icon: UtensilsCrossed },
      { title: 'Speiseplan', url: '/admin/menu-planner', icon: Calendar },
      { title: 'Bestellungen', url: '/admin/orders', icon: ShoppingBag },
      { title: 'Metadaten', url: '/admin/metadata', icon: Tags },
    ],
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: Ticket,
    items: [
      { title: 'Motto-Banner', url: '/admin/promotions/banners', icon: Megaphone },
      { title: 'Coupons', url: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: TrendingUp,
    items: [
      { title: 'Kundensegmente', url: '/admin/marketing/segments', icon: Users2 },
      { title: 'Journeys', url: '/admin/marketing/journeys', icon: GitBranch },
      { title: 'Kampagnen', url: '/admin/marketing/campaigns', icon: Mail },
      { title: 'Automation', url: '/admin/marketing/automation', icon: Zap },
      { title: 'Vorlagen', url: '/admin/marketing/templates', icon: LayoutTemplate },
      { title: 'In-App Nachrichten', url: '/admin/marketing/inapp', icon: Megaphone },
      { title: 'Push-Benachrichtigungen', url: '/admin/marketing/push', icon: BellRing },
    ],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    icon: Wallet,
    items: [
      { title: 'Guthaben verwalten', url: '/admin/wallet', icon: Wallet },
      { title: 'Zahlungen', url: '/admin/zahlungen', icon: Receipt },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    icon: Building2,
    items: [
      { title: 'Kunden', url: '/admin/kunden', icon: Users2 },
      { title: 'Standorte', url: '/admin/locations', icon: Pin },
      { title: 'Unternehmen', url: '/admin/companies', icon: Building2 },
      { title: 'Vertragspartner-Abrechnung', url: '/admin/billing', icon: Receipt },
      { title: 'Nutzer', url: '/admin/users', icon: Users },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    items: [
      { title: 'Einstellungen', url: '/admin/settings', icon: Settings },
      { title: 'Zahleinstellungen', url: '/admin/settings/payments', icon: CreditCard },
    ],
  },
]

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function isItemActive(url: string, pathname: string): boolean {
  if (url === '/admin') return pathname === '/admin'
  return pathname === url || pathname.startsWith(url + '/')
}

function getActiveGroupId(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    if (group.directUrl && isItemActive(group.directUrl, pathname)) return group.id
    if (group.items?.some((item) => isItemActive(item.url, pathname))) return group.id
  }
  return null
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [openGroupId, setOpenGroupId] = React.useState<string | null>(null)

  // Auto-open the flyout for the currently active group on navigation
  React.useEffect(() => {
    const activeId = getActiveGroupId(pathname)
    if (activeId && activeId !== 'dashboard') {
      setOpenGroupId(activeId)
    }
  }, [pathname])

  const activeGroupId = getActiveGroupId(pathname)

  function handleRailClick(group: NavGroup) {
    if (group.directUrl) {
      setOpenGroupId(null)
      router.push(group.directUrl)
      return
    }
    setOpenGroupId((prev) => (prev === group.id ? null : group.id))
  }

  const openGroup = NAV_GROUPS.find((g) => g.id === openGroupId && g.items)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full">
        {/* ── Icon Rail ──────────────────────────────────────────────── */}
        <nav
          className="flex flex-col items-center w-16 shrink-0 bg-indigo-950 py-3 gap-1"
          aria-label="Hauptnavigation"
        >
          {/* Logo */}
          <Link
            href="/admin"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 mb-3 hover:bg-white/20 transition-colors shrink-0"
            aria-label="Kantine Platform – Admin"
          >
            <span className="text-xl leading-none">🍳</span>
          </Link>

          {/* Groups */}
          <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
            {NAV_GROUPS.map((group) => {
              const Icon = group.icon
              const isActive = activeGroupId === group.id
              const isOpen = openGroupId === group.id

              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleRailClick(group)}
                      className={`
                        relative flex flex-col items-center justify-center w-full rounded-xl
                        py-2.5 px-1 gap-1 transition-all duration-200 cursor-pointer
                        ${isActive || isOpen
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:bg-white/10 hover:text-white/90'}
                      `}
                      aria-label={group.label}
                      aria-expanded={group.items ? isOpen : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-[10px] font-medium leading-tight text-center w-full truncate px-0.5">
                        {group.label}
                      </span>
                      {/* Active dot */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-1">
                    <p>{group.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Log out */}
          <div className="w-full px-2 pt-2 border-t border-white/10 mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex flex-col items-center justify-center w-full rounded-xl py-2.5 px-1 gap-1 text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer"
                  aria-label="Abmelden"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-tight">Logout</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-1">
                <p>Abmelden</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>

        {/* ── Flyout Panel ───────────────────────────────────────────── */}
        <div
          className={`
            flex flex-col shrink-0 bg-indigo-900 overflow-hidden
            transition-all duration-250 ease-in-out
            ${openGroup ? 'w-56' : 'w-0'}
          `}
          aria-hidden={!openGroup}
        >
          {openGroup && (
            <div className="flex flex-col h-full w-56">
              {/* Flyout header */}
              <div className="flex items-center justify-between px-4 pt-5 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                  {openGroup.label}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenGroupId(null)}
                  className="text-white/40 hover:text-white/80 transition-colors p-0.5 rounded"
                  aria-label="Flyout schließen"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Flyout items */}
              <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto pb-4">
                {openGroup.items?.map((item) => {
                  const Icon = item.icon
                  const isActive = isItemActive(item.url, pathname)
                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                        ${isActive
                          ? 'bg-white/20 text-white font-semibold shadow-sm'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'}
                      `}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
