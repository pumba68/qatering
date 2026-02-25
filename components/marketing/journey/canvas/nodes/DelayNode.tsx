'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Clock } from 'lucide-react'
import type { DelayNodeConfig } from '../../journey-types'

const UNIT_LABELS: Record<string, string> = {
  minutes: 'Minuten',
  hours: 'Stunden',
  days: 'Tage',
}

const DelayNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as DelayNodeConfig

  return (
    <div
      className={`rounded-xl border-2 bg-gray-50 p-4 min-w-[160px] shadow-sm transition-shadow ${
        selected ? 'border-gray-600 shadow-md' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Warten</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mt-1">
        {config.amount ?? 1} {UNIT_LABELS[config.unit ?? 'days']}
      </p>
      {config.waitUntil && (
        <p className="text-xs text-gray-400 mt-0.5">
          bis {['So','Mo','Di','Mi','Do','Fr','Sa'][config.waitUntil.weekday]} {config.waitUntil.hour}:00 Uhr
        </p>
      )}
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-gray-400" />
    </div>
  )
})
DelayNode.displayName = 'DelayNode'
export default DelayNode
