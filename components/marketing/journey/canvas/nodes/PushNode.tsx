'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Smartphone } from 'lucide-react'
import type { PushNodeConfig } from '../../journey-types'

const PushNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as PushNodeConfig
  const hasTemplate = Boolean(config.templateId)

  return (
    <div
      className={`rounded-xl border-2 bg-green-50 p-4 min-w-[180px] shadow-sm transition-shadow ${
        selected ? 'border-green-600 shadow-md' : hasTemplate ? 'border-green-300' : 'border-orange-300'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-green-400" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Push</span>
      </div>
      {hasTemplate ? (
        <p className="text-sm font-medium text-gray-800 mt-1 leading-tight truncate max-w-[160px]">
          {config.templateName ?? config.templateId}
        </p>
      ) : (
        <p className="text-sm text-orange-500 mt-1">Template auswählen</p>
      )}
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-green-400" />
    </div>
  )
})
PushNode.displayName = 'PushNode'
export default PushNode
