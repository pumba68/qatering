'use client'

import { useState } from 'react'
import { Play, Clock, Mail, Bell, Smartphone, Gift, GitFork, Flag, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PALETTE_ITEMS, PALETTE_GROUPS, type JourneyNodeType } from '../journey-types'

const NODE_ICONS: Record<JourneyNodeType, React.ElementType> = {
  start: Play,
  delay: Clock,
  email: Mail,
  inapp: Bell,
  push: Smartphone,
  incentive: Gift,
  branch: GitFork,
  end: Flag,
}

export function NodePalette() {
  const [search, setSearch] = useState('')

  const filtered = PALETTE_ITEMS.filter((item) =>
    !search || item.label.toLowerCase().includes(search.toLowerCase())
  )

  const onDragStart = (event: React.DragEvent, type: JourneyNodeType) => {
    event.dataTransfer.setData('application/journey-node', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-56 flex-shrink-0 border-r bg-white flex flex-col h-full">
      <div className="p-3 border-b">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nodes</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {PALETTE_GROUPS.map((group) => {
          const items = filtered.filter((item) => item.group === group.key)
          if (items.length === 0) return null
          return (
            <div key={group.key}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
                {group.label}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = NODE_ICONS[item.type]
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 bg-gray-50 cursor-grab hover:bg-gray-100 hover:border-gray-200 transition-colors select-none"
                      title={item.description}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 leading-tight">{item.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Keine Nodes gefunden</p>
        )}
      </div>

      <div className="p-3 border-t">
        <p className="text-xs text-gray-400 text-center leading-tight">
          Node auf Canvas ziehen, um hinzuzufügen
        </p>
      </div>
    </div>
  )
}
