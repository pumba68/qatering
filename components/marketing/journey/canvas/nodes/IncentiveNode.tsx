'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Gift } from 'lucide-react'
import type { IncentiveNodeConfig } from '../../journey-types'

const IncentiveNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config ?? {}) as IncentiveNodeConfig

  const label =
    config.incentiveType === 'wallet_credit'
      ? config.walletAmount
        ? `${config.walletAmount} € Guthaben`
        : 'Wallet-Guthaben'
      : config.couponName ?? config.couponId ?? 'Coupon auswählen'

  return (
    <div
      className={`rounded-xl border-2 bg-orange-50 p-4 min-w-[180px] shadow-sm transition-shadow ${
        selected ? 'border-orange-600 shadow-md' : 'border-orange-300'
      }`}
    >
      <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-orange-400" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Gift className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Incentive</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mt-1">{label}</p>
      <p className="text-xs text-orange-500 mt-0.5">
        {config.incentiveType === 'wallet_credit' ? 'Wallet-Guthaben' : 'Coupon'}
      </p>
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-orange-400" />
    </div>
  )
})
IncentiveNode.displayName = 'IncentiveNode'
export default IncentiveNode
