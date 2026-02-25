'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Flag } from 'lucide-react'
import type { EndNodeConfig } from '../../journey-types'

const EndNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as EndNodeConfig

  return (
    <div
      className={`rounded-xl border-2 bg-gray-800 p-4 min-w-[140px] shadow-sm transition-shadow ${
        selected ? 'border-gray-400 shadow-md' : 'border-gray-600'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <Flag className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Ende</span>
      </div>
      <p className="text-sm font-medium text-gray-200 mt-1">
        {config.label ?? 'Journey beendet'}
      </p>
    </div>
  )
})
EndNode.displayName = 'EndNode'
export default EndNode
