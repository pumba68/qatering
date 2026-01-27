'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Navbar nicht auf Login/Register oder im Admin-Bereich anzeigen
  // Im Admin-Bereich ist die Sidebar die Hauptnavigation
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-border/40 backdrop-blur-xl bg-background/80 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="flex items-center space-x-3 group transition-transform hover:scale-105"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors"></div>
              <span className="relative text-3xl transform transition-transform group-hover:rotate-12">🍽️</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Kantine Platform
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Lädt...</span>
              </div>
            ) : session ? (
              <>
                <Link
                  href="/menu"
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/menu' 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {pathname === '/menu' && (
                    <span className="absolute inset-0 bg-primary/5 rounded-lg blur-sm"></span>
                  )}
                  <span className="relative">Menü</span>
                </Link>
                <Link
                  href="/wiki"
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/wiki' 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {pathname === '/wiki' && (
                    <span className="absolute inset-0 bg-primary/5 rounded-lg blur-sm"></span>
                  )}
                  <span className="relative">📚 Wiki</span>
                </Link>
                {(session.user as any)?.role === 'KITCHEN_STAFF' ||
                (session.user as any)?.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname.startsWith('/admin')
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {pathname.startsWith('/admin') && (
                      <span className="absolute inset-0 bg-primary/5 rounded-lg blur-sm"></span>
                    )}
                    <span className="relative">Admin</span>
                  </Link>
                ) : null}
                <ThemeToggle />
                <div className="flex items-center space-x-3 pl-3 border-l border-border">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-foreground">
                      {session.user?.name || session.user?.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                  >
                    Abmelden
                  </button>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover-lift"
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
