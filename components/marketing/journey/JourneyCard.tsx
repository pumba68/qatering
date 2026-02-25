'use client'

import Link from 'next/link'
import { MoreHorizontal, Play, Pause, Copy, Archive, Trash2, BarChart2, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Journey } from './journey-types'
import { STATUS_CONFIG, TRIGGER_LABELS } from './journey-types'

interface JourneyCardProps {
  journey: Journey
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function JourneyCard({
  journey,
  onPause,
  onResume,
  onDuplicate,
  onDelete,
  onArchive,
}: JourneyCardProps) {
  const statusCfg = STATUS_CONFIG[journey.status]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{journey.name}</h3>
          {journey.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{journey.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs ${statusCfg.color} border-0`}>{statusCfg.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/marketing/journeys/${journey.id}/canvas`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/marketing/journeys/${journey.id}/analytics`}>
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {journey.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => onPause(journey.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausieren
                </DropdownMenuItem>
              )}
              {journey.status === 'PAUSED' && (
                <DropdownMenuItem onClick={() => onResume(journey.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Fortsetzen
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(journey.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              {journey.status !== 'ARCHIVED' && (
                <DropdownMenuItem
                  onClick={() => onArchive(journey.id)}
                  className="text-orange-600"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archivieren
                </DropdownMenuItem>
              )}
              {journey.status === 'DRAFT' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(journey.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Trigger info */}
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-700">Trigger:</span>{' '}
        {TRIGGER_LABELS[journey.triggerType]}
      </p>

      {/* KPIs */}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2.5">
        <div>
          <span className="font-semibold text-gray-800">{journey.activeParticipants ?? 0}</span>{' '}
          aktiv
        </div>
        <div>
          <span className="font-semibold text-gray-800">{journey.totalParticipants ?? 0}</span>{' '}
          gesamt
        </div>
        <div>
          <span className="font-semibold text-gray-800">{journey.conversionRate ?? 0}%</span>{' '}
          Konversion
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
          <Link href={`/admin/marketing/journeys/${journey.id}/canvas`}>
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Bearbeiten
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
          <Link href={`/admin/marketing/journeys/${journey.id}/analytics`}>
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
            Analytics
          </Link>
        </Button>
      </div>
    </div>
  )
}
