import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

interface BaseNodeProps {
  selected?: boolean
  label?: string
  children?: React.ReactNode
  color?: string
  onTitleClick?: () => void
  className?: string
}

export const BaseNode: React.FC<BaseNodeProps> = memo(
  ({
    selected,
    label,
    children,
    color = 'var(--tk-color-brand-primary)',
    onTitleClick,
    className = ''
  }) => {
    return (
      <div
        className={`
        min-w-[150px] rounded-tk-md border-2 bg-bg-surface text-text-main shadow-lg transition-all
        ${selected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border-main'}
        ${className}
      `}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-text-dim !w-2 !h-2 border-none"
        />

        <div
          className="px-tk-3 py-tk-2 border-b border-border-main flex items-center gap-tk-2 cursor-pointer"
          onClick={onTitleClick}
        >
          <div className="w-tk-2 h-tk-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-tk-sm font-semibold truncate">{label}</span>
        </div>

        <div className="p-tk-3">{children}</div>

        <Handle
          type="source"
          position={Position.Right}
          className="!bg-brand-primary !w-2 !h-2 border-none"
        />
      </div>
    )
  }
)

BaseNode.displayName = 'BaseNode'
