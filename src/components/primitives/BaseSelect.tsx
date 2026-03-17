import React from 'react'
import { BaseText } from './BaseText'
import { BaseIcon } from './BaseIcon'

interface SelectOption {
  value: string | number
  label: string
}

interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  fullWidth?: boolean
  placeholder?: string | undefined
}

export const BaseSelect = React.forwardRef<HTMLSelectElement, BaseSelectProps>(
  ({ label, options, fullWidth, placeholder, className, style, ...props }, ref) => {
    const isEmpty = !props.value && props.value !== 0
    const containerClasses = `relative ${fullWidth ? 'w-full' : ''}`
    const selectClasses = `
      flex h-10 w-full items-center justify-between rounded-tk-md border border-border-main bg-bg-surface px-tk-3 py-tk-2 text-tk-sm
      ring-offset-bg-main placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-brand-primary focus:ring-offset-1
      disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-shadow duration-200 ease-in-out
      ${className ?? ''}
    `

    return (
      <div className="w-full">
        {label && (
          <BaseText size="sm" weight="medium" className="text-text-main mb-tk-1 block">
            {label}
          </BaseText>
        )}
        <div className={containerClasses}>
          <select
            ref={ref}
            className={selectClasses}
            style={{ color: isEmpty ? 'var(--color-text-dim)' : undefined, ...style }}
            {...props}
          >
            <option value="" disabled hidden>
              {placeholder ?? 'Select an option'}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim">
            <BaseIcon name="ChevronsUpDown" size={16} />
          </div>
        </div>
      </div>
    )
  }
)

BaseSelect.displayName = 'BaseSelect'
