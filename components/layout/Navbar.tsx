'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WalletWidget } from '@/components/wallet/WalletWidget'
import { BookOpen, LayoutDashboard, LogOut, UtensilsCrossed, UserCircle } from 'lucide-react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const hideNav = pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')

  function NavLink({
    href,
    label,
    Icon,
    active,
  }: {
    href: string
    label: string
    Icon: React.ComponentType<{ className?: string }>
    active: boolean
  }) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </Link>
    )
  }

  if (hideNav) return null

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity"
          >
            <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-muted text-lg" aria-hidden>
              🍽️
            </span>
            <span className="text-lg font-bold tracking-tight">
              Kantine Platform
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            {status === 'loading' ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
                <span>Lädt...</span>
              </div>
            ) : session ? (
              <>
                <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-muted/50 border border-border/50">
                  <NavLink href="/menu" label="Menü" Icon={UtensilsCrossed} active={pathname === '/menu'} />
                  <NavLink href="/wiki" label="Wiki" Icon={BookOpen} active={pathname === '/wiki'} />
                  {((session.user as any)?.role === 'KITCHEN_STAFF' || (session.user as any)?.role === 'ADMIN') && (
                    <NavLink href="/admin" label="Admin" Icon={LayoutDashboard} active={pathname.startsWith('/admin')} />
                  )}
                </div>
                <div className="flex sm:hidden items-center gap-1">
                  <Link href="/menu" className="p-2 rounded-xl text-muted-foreground hover:bg-muted" aria-label="Menü">
                    <UtensilsCrossed className="w-5 h-5" />
                  </Link>
                  <Link href="/wiki" className="p-2 rounded-xl text-muted-foreground hover:bg-muted" aria-label="Wiki">
                    <BookOpen className="w-5 h-5" />
                  </Link>
                  {((session.user as any)?.role === 'KITCHEN_STAFF' || (session.user as any)?.role === 'ADMIN') && (
                    <Link href="/admin" className="p-2 rounded-xl text-muted-foreground hover:bg-muted" aria-label="Admin">
                      <LayoutDashboard className="w-5 h-5" />
                    </Link>
                  )}
                </div>
                <WalletWidget />
                <ThemeToggle />
                <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border/60">
                  <div className="flex flex-col items-end min-w-0">
                    <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                      {session.user?.name || session.user?.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {session.user?.email}
                    </span>
                  </div>
                  {(session.user as any)?.role === 'CUSTOMER' && (
                    <Link
                      href="/profil"
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                      aria-label="Mein Profil"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="hidden lg:inline">Profil</span>
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                    aria-label="Abmelden"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Abmelden</span>
                  </button>
                </div>
                <div className="flex md:hidden items-center gap-1">
                  {(session.user as any)?.role === 'CUSTOMER' && (
                    <Link
                      href="/profil"
                      className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
                      aria-label="Mein Profil"
                    >
                      <UserCircle className="w-5 h-5" />
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
                    aria-label="Abmelden"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-md transition-all"
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
