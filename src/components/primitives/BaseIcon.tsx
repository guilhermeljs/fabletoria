import React from 'react'
import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

export type IconName = keyof typeof LucideIcons

interface BaseIconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
  size?: number | string
  color?: string
  className?: string
}

export const BaseIcon: React.FC<BaseIconProps> = ({
  name,
  size = 18,
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const IconComponent = LucideIcons[name] as React.FC<LucideProps>

  if (!IconComponent) {
    console.warn("Icon '${name}' not found in lucide-react")
    return null
  }

  return <IconComponent size={size} color={color} className={className} {...props} />
}
