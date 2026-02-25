'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitFork } from 'lucide-react'
import type { BranchNodeConfig } from '../../journey-types'

const CONDITION_LABELS: Record<string, string> = {
  attribute: 'Nutzer-Attribut',
  event: 'Event prüfen',
  segment: 'Segment-Zugehörigkeit',
  email_opened: 'E-Mail geöffnet',
}

const BranchNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as BranchNodeConfig

  const conditionLabel =
    config.conditionType === 'segment' && config.segmentName
      ? `Segment: ${config.segmentName}`
      : config.conditionType === 'event' && config.eventType
        ? `Event: ${config.eventType}`
        : CONDITION_LABELS[config.conditionType ?? 'event'] ?? 'Bedingung'

  return (
    <div
      className={`rounded-xl border-2 bg-yellow-50 p-4 min-w-[200px] shadow-sm transition-shadow ${
        selected ? 'border-yellow-600 shadow-md' : 'border-yellow-300'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-yellow-500" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
          <GitFork className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Bedingung</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mt-1 leading-tight">{conditionLabel}</p>
      {config.windowDays && (
        <p className="text-xs text-yellow-600 mt-0.5">letzte {config.windowDays} Tage</p>
      )}
      {/* JA / NEIN handles */}
      <div className="flex justify-between mt-3 px-1">
        <div className="flex flex-col items-center gap-1">
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '20%', bottom: '-6px' }}
            className="!w-3 !h-3 !bg-green-500 !relative !transform-none !left-auto !bottom-auto"
          />
          <span className="text-xs text-green-600 font-semibold">JA</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ right: '20%', bottom: '-6px' }}
            className="!w-3 !h-3 !bg-red-400 !relative !transform-none !right-auto !bottom-auto"
          />
          <span className="text-xs text-red-500 font-semibold">NEIN</span>
        </div>
      </div>
    </div>
  )
})
BranchNode.displayName = 'BranchNode'
export default BranchNode
