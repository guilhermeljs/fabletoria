import React from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost'
type BadgeSize = 'xs' | 'sm' | 'md'

interface BaseBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  rounded?: boolean
  className?: string
}

export const BaseBadge: React.FC<BaseBadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  rounded = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center px-tk-2 py-tk-0.5 font-medium transition-colors'

  const sizeClasses = {
    xs: 'text-[10px] px-tk-1 py-0',
    sm: 'text-tk-xs px-tk-2 py-tk-0.5',
    md: 'text-tk-sm px-tk-3 py-tk-1'
  }

  const variantClasses = {
    default: 'bg-bg-surface text-text-dim border border-border-main',
    primary: 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30',
    success: 'bg-status-success/20 text-status-success border border-status-success/30',
    warning: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
    error: 'bg-status-error/20 text-status-error border border-status-error/30',
    info: 'bg-status-info/20 text-status-info border border-status-info/30',
    ghost: 'bg-transparent text-text-dim border border-transparent'
  }

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-tk-sm'

  const finalClassName = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${roundedClasses}
    ${className}
  `.trim()

  return <span className={finalClassName}>{children}</span>
}
