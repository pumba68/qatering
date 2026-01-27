'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Calendar,
  Settings,
} from 'lucide-react'

const menuItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Übersicht & Bestellungen',
  },
  {
    href: '/admin/dishes',
    label: 'Gerichte',
    icon: UtensilsCrossed,
    description: 'Gerichte verwalten',
  },
  {
    href: '/admin/menu-planner',
    label: 'Speiseplan',
    icon: Calendar,
    description: 'Wochenplan erstellen',
  },
  // Weitere Menüpunkte können hier hinzugefügt werden
  // {
  //   href: '/admin/settings',
  //   label: 'Einstellungen',
  //   icon: Settings,
  //   description: 'System-Einstellungen',
  // },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 dark:bg-gray-950 text-white min-h-screen flex flex-col border-r border-gray-800">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">🍳 Admin Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Kantine Verwaltung</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
                         (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <Icon className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          Kantine Platform v0.1.0
        </p>
      </div>
    </aside>
  )
}