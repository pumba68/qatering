'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import type { StartNodeConfig } from '../../journey-types'
import { EVENT_TYPES, TRIGGER_LABELS } from '../../journey-types'

const StartNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as StartNodeConfig
  const label =
    config.triggerType === 'EVENT'
      ? EVENT_TYPES.find((e) => e.value === config.eventType)?.label ?? config.eventType ?? 'Event'
      : config.triggerType === 'SEGMENT_ENTRY'
        ? 'Segment-Eintritt'
        : config.dateField ?? 'Datum-basiert'

  return (
    <div
      className={`rounded-xl border-2 bg-purple-50 p-4 min-w-[180px] shadow-sm transition-shadow ${
        selected ? 'border-purple-600 shadow-md' : 'border-purple-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
        </div>
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Start</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mt-1 leading-tight">{label}</p>
      <p className="text-xs text-purple-500 mt-0.5">{TRIGGER_LABELS[config.triggerType ?? 'EVENT']}</p>
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-purple-500" />
    </div>
  )
})
StartNode.displayName = 'StartNode'
export default StartNode
