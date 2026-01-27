'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/layout/Navbar.tsx:11',message:'Navbar render',data:{status,hasSession:!!session,userId:(session?.user as any)?.id,userRole:(session?.user as any)?.role,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  }
  // #endregion

  // Navbar nicht auf Login/Register anzeigen
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Kantine Platform
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {status === 'loading' ? (
              <div className="text-gray-500 dark:text-gray-400">Lädt...</div>
            ) : session ? (
              <>
                <Link
                  href="/menu"
                  className={`text-gray-700 dark:text-gray-300 hover:text-primary transition-colors ${
                    pathname === '/menu' ? 'text-primary font-medium' : ''
                  }`}
                >
                  Menü
                </Link>
                <Link
                  href="/wiki"
                  className={`text-gray-700 dark:text-gray-300 hover:text-primary transition-colors ${
                    pathname === '/wiki' ? 'text-primary font-medium' : ''
                  }`}
                >
                  📚 Wiki
                </Link>
                {(session.user as any)?.role === 'KITCHEN_STAFF' ||
                (session.user as any)?.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className={`text-gray-700 dark:text-gray-300 hover:text-primary transition-colors ${
                      pathname.startsWith('/admin')
                        ? 'text-primary font-medium'
                        : ''
                    }`}
                  >
                    Admin
                  </Link>
                ) : null}
                <ThemeToggle />
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
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
