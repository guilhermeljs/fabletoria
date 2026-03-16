import React, { useMemo, useState } from 'react'
import { BaseButton } from '../primitives/BaseButton'
import { BaseInput } from '../primitives/BaseInput'
import { BaseSelect } from '../primitives/BaseSelect'
import { BaseText } from '../primitives/BaseText'

export type FeedbackFieldType = 'input' | 'email' | 'textarea' | 'select'

export interface FeedbackFieldOption {
  value: string | number
  label: string
}

export interface FeedbackFieldConfig {
  name: string
  label: string
  type: FeedbackFieldType
  placeholder?: string
  options?: FeedbackFieldOption[]
  required?: boolean
  maxLength?: number
}

export interface FeedbackFieldError {
  field: string
  message: string
}

export interface FeedbackModalProps {
  open: boolean
  fields: FeedbackFieldConfig[]
  onSubmit: (values: Record<string, string | number>) => void
  onClose: () => void
  title?: string
  description?: string
  errors?: FeedbackFieldError[]
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  fields,
  onSubmit,
  onClose,
  title = 'Feedback',
  description,
  errors = [],
}) => {
  const initialValues = useMemo(() => {
    const vals: Record<string, string | number> = {}
    for (const field of fields) {
      vals[field.name] = ''
    }
    return vals
  }, [fields])

  const [values, setValues] = useState<Record<string, string | number>>(initialValues)

  const handleChange = (name: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (field: FeedbackFieldConfig, strValue: string) => {
    const matched = field.options?.find((o) => String(o.value) === strValue)
    handleChange(field.name, matched ? matched.value : strValue)
  }

  if (!open) return null

  const errorMap = Object.fromEntries(errors.map((e) => [e.field, e.message]))

  const renderField = (field: FeedbackFieldConfig) => {
    const value = values[field.name] ?? ''
    const error = errorMap[field.name]

    const errorEl = error ? (
      <div className="mt-tk-1 flex items-center gap-1 rounded-tk-sm bg-status-error/10 px-tk-2 py-tk-1 border border-status-error/30">
        <span className="text-status-error" style={{ fontSize: '10px' }}>●</span>
        <BaseText size="sm" className="text-status-error">
          {error}
        </BaseText>
      </div>
    ) : null

    switch (field.type) {
      case 'input':
      case 'email':
        return (
          <div key={field.name}>
            <BaseInput
              label={field.label}
              placeholder={field.placeholder}
              value={String(value)}
              type={field.type === 'email' ? 'email' : 'text'}
              required={field.required}
              maxLength={field.maxLength || 128}
              onChange={(e) => handleChange(field.name, e.target.value)}
              fullWidth
            />
            {errorEl}
          </div>
        )
      case 'textarea':
        return (
          <div key={field.name}>
            <BaseText size="sm" weight="medium" className="text-text-main mb-tk-1 block">
              {field.label}
            </BaseText>
            <textarea
              value={String(value)}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength || 128}
              className="flex h-28 w-full rounded-tk-md border border-border-main
    bg-bg-surface px-tk-3 py-tk-2 text-tk-sm text-text-main
    ring-offset-bg-main file:border-0 file:bg-transparent file:text-tk-sm file:font-medium
    placeholder:text-text-dim focus-visible:outline-none
    focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:ring-offset-1
    disabled:cursor-not-allowed disabled:opacity-50
    transition-shadow duration-200 ease-in-outext-text-dim focus:outline-none focus:ring-1 focus:ring-brand-primary focus:ring-offset-1"
            />
            {errorEl}
          </div>
        )
      case 'select':
        return (
          <div key={field.name}>
            <BaseSelect
              label={field.label}
              options={field.options ?? []}
              value={String(value)}
              onChange={(e) => handleSelectChange(field, e.target.value)}
              fullWidth
            />
            {errorEl}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[4000] w-[min(360px,calc(100vw-32px))]">
      <div className="rounded-tk-md border border-border-main bg-bg-surface p-tk-4 shadow-elevation-4">
        <div className="flex items-start justify-between gap-tk-3">
          <div>
            <BaseText size="sm" weight="bold" className="text-text-main">
              {title}
            </BaseText>
            {description && (
              <BaseText size="sm" variant="dim" className="mt-tk-1 block">
                {description}
              </BaseText>
            )}
          </div>
        </div>

        <div className="mt-tk-4 space-y-tk-3">
          {fields.map((field) => (
            <React.Fragment key={field.name}>
              {renderField(field)}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-tk-4 flex justify-end gap-tk-2">
          <BaseButton variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </BaseButton>
          <BaseButton variant="secondary" size="sm" onClick={() => onSubmit(values)}>
            Submit
          </BaseButton>
        </div>
      </div>
    </div>
  )
}
