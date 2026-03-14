import React, { useMemo, useState } from 'react'
import { BaseButton } from '../primitives/BaseButton'
import { BaseInput } from '../primitives/BaseInput'
import { BaseSelect } from '../primitives/BaseSelect'
import { BaseText } from '../primitives/BaseText'

export type FeedbackFieldType = 'input' | 'textarea' | 'select'

export interface FeedbackFieldOption {
  value: string | number
  label: string
}

export interface FeedbackFieldConfig {
  /** Unique key for the field */
  name: string
  /** Label shown above the field */
  label: string
  /** Field type */
  type: FeedbackFieldType
  /** Placeholder text */
  placeholder?: string
  /** Select options (only for type="select") */
  options?: FeedbackFieldOption[]
  /** Whether the field is required */
  required?: boolean
}

export interface FeedbackModalProps {
  /** Whether the modal is visible */
  open: boolean
  /** Configuration for the fields displayed */
  fields: FeedbackFieldConfig[]
  /** Called when the user submits the form */
  onSubmit: (values: Record<string, string>) => void
  /** Called when the modal is closed (cancel, etc.) */
  onClose: () => void
  /** Optional title */
  title?: string
  /** Optional description text */
  description?: string
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  fields,
  onSubmit,
  onClose,
  title = 'Feedback',
  description,
}) => {
  const initialValues = useMemo(() => {
    const vals: Record<string, string> = {}
    for (const field of fields) {
      vals[field.name] = ''
    }
    return vals
  }, [fields])

  const [values, setValues] = useState<Record<string, string>>(initialValues)

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  if (!open) return null

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
          {fields.map((field) => {
            const value = values[field.name] ?? ''
            switch (field.type) {
              case 'input':
                return (
                  <BaseInput
                    key={field.name}
                    label={field.label}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    fullWidth
                  />
                )
              case 'textarea':
                return (
                  <div key={field.name}>
                    <BaseText size="sm" weight="medium" className="text-text-main mb-tk-1 block">
                      {field.label}
                    </BaseText>
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-28 w-full rounded-tk-md border border-border-main bg-bg-surface px-tk-3 py-tk-2 text-tk-sm text-text-main placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-brand-primary focus:ring-offset-1"
                    />
                  </div>
                )
              case 'select':
                return (
                  <BaseSelect
                    key={field.name}
                    label={field.label}
                    options={field.options ?? []}
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    fullWidth
                  />
                )
              default:
                return null
            }
          })}
        </div>

        <div className="mt-tk-4 flex justify-end gap-tk-2">
          <BaseButton variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </BaseButton>
          <BaseButton variant="secondary" size="sm" onClick={handleSubmit}>
            Submit
          </BaseButton>
        </div>
      </div>
    </div>
  )
}
