'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Mail } from 'lucide-react'
import type { EmailNodeConfig } from '../../journey-types'

const EmailNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as EmailNodeConfig
  const hasTemplate = Boolean(config.templateId)

  return (
    <div
      className={`rounded-xl border-2 bg-blue-50 p-4 min-w-[180px] shadow-sm transition-shadow ${
        selected ? 'border-blue-600 shadow-md' : hasTemplate ? 'border-blue-300' : 'border-orange-300'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-blue-400" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Mail className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">E-Mail</span>
      </div>
      {hasTemplate ? (
        <p className="text-sm font-medium text-gray-800 mt-1 leading-tight truncate max-w-[160px]">
          {config.templateName ?? config.templateId}
        </p>
      ) : (
        <p className="text-sm text-orange-500 mt-1">Template auswählen</p>
      )}
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-blue-400" />
    </div>
  )
})
EmailNode.displayName = 'EmailNode'
export default EmailNode
