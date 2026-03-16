import React from 'react'

type TextVariant = 'default' | 'dim' | 'primary' | 'success' | 'warning' | 'error'
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'

interface BaseTextProps {
  children: React.ReactNode
  variant?: TextVariant
  size?: TextSize
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  italic?: boolean
  className?: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div'
}

export const BaseText: React.FC<BaseTextProps> = ({
  children,
  variant = 'default',
  size = 'base',
  weight = 'normal',
  italic = false,
  className = '',
  as: Component = 'span'
}) => {
  const variantClasses = {
    default: 'text-text-main',
    dim: 'text-text-dim',
    primary: 'text-brand-primary',
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error'
  }

  const sizeClasses = {
    xs: 'text-tk-xs',
    sm: 'text-tk-sm',
    base: 'text-tk-base',
    lg: 'text-tk-lg',
    xl: 'text-tk-xl',
    '2xl': 'text-tk-2xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  const finalClassName = [
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    italic ? 'italic' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return <Component className={finalClassName}>{children}</Component>
}
