import { useState, useRef, useEffect } from 'react'
import type { Component, FieldSchema, FieldType } from '../../lib/types'
import { BaseButton } from '../primitives/BaseButton'
import { BaseInput } from '../primitives/BaseInput'
import { BaseText } from '../primitives/BaseText'
import TiptapEditor from '../inspector/TiptapEditor'
import { BaseSelect } from '../primitives/BaseSelect'
import { BaseIcon } from '../primitives/BaseIcon'

interface ComponentSchemaModalProps {
  component?: Component
  onSave: (name: string, schema: FieldSchema[], defaults: Record<string, string>) => void
  onClose: () => void
}

export default function ComponentSchemaModal({
  component,
  onSave,
  onClose
}: ComponentSchemaModalProps) {
  const [name, setName] = useState(component?.name ?? '')
  const [defaultTitle, setDefaultTitle] = useState(component?.defaults.title ?? '')
  const [defaultContent, setDefaultContent] = useState(component?.defaults.content ?? '')
  const [fields, setFields] = useState<FieldSchema[]>(component?.schema ?? [])
  const nameRef = useRef<HTMLInputElement>(null)

  const isEditing = component !== undefined

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function addField() {
    setFields((prev) => [...prev, { name: '', type: 'string' as FieldType }])
  }

  function updateField(index: number, partial: Partial<FieldSchema>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...partial } : f)))
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const validFields = fields.filter((f) => f.name.trim())

    onSave(trimmedName, validFields, { title: defaultTitle, content: defaultContent })
  }

  return (
    <div className="bg-bg-surface border border-border-main rounded-tk-xl shadow-2xl w-[500px] flex flex-col overflow-hidden pointer-events-auto max-h-[80vh]">
      <header className="flex items-center justify-between py-tk-1 border-border-main border-b shrink-0">
        <BaseText size="xs" weight="semibold" className="ml-tk-4 uppercase" variant="dim">
          {isEditing ? `Edit Component: ${component.name}` : 'New Component'}
        </BaseText>
        <BaseButton variant="ghost" size="sm" onClick={onClose} className="min-w-0 p-tk-1">
          <BaseIcon name="X" size={18} />
        </BaseButton>
      </header>
      <main className="p-tk-6 flex-1 overflow-y-auto space-y-tk-4">
        <BaseInput
          size="md"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
          placeholder="Component name (e.g. Character, Location...)"
          fullWidth
        />
        <div>
          <BaseInput
            value={defaultTitle}
            onChange={(e) => setDefaultTitle(e.target.value)}
            placeholder="Variation default title"
            fullWidth
          />
          <BaseText size="xs" variant="dim" className="mt-tk-1 px-tk-1 block">
            Shown on the node header. Use {'{{self.fieldName}}'} for variables.
          </BaseText>
        </div>
        <div className="space-y-tk-2">
          <TiptapEditor
            key={component?.id}
            value={defaultContent}
            onChange={(content) => setDefaultContent(content)}
          />
        </div>
        <div className="space-y-tk-3">
          <BaseText size="sm" weight="medium">
            Custom Fields
          </BaseText>
          {fields.length > 0 ? (
            <div className="space-y-tk-2 rounded-tk-md border border-border-main p-tk-3">
              {fields.map((field, i) => (
                <div key={i} className="flex items-center gap-tk-2">
                  <BaseInput
                    value={field.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    placeholder="Field name"
                    fullWidth
                    size="md"
                  />
                  <BaseSelect
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                    options={[
                      { value: 'string', label: 'String' },
                      { value: 'number', label: 'Number' }
                    ]}
                  />
                  <BaseButton
                    variant="ghost"
                    onClick={() => removeField(i)}
                    className="p-tk-2 text-text-dim hover:text-status-error"
                  >
                    <BaseIcon name="Trash2" size={16} />
                  </BaseButton>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-tk-6 border-2 border-dashed border-border-main rounded-tk-lg flex flex-col items-center justify-center gap-tk-2 text-text-dim">
              <BaseIcon name="ListX" size={24} className="color-border-main" />
              <BaseText size="xs">No custom fields yet.</BaseText>
            </div>
          )}
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={addField}
            leftIcon={<BaseIcon name="Plus" size={16} />}
          >
            Add Field
          </BaseButton>
        </div>
      </main>

      <footer className="flex justify-end gap-tk-3 p-tk-2 border-t border-border-main bg-bg-header">
        <BaseButton variant="ghost" size="md" onClick={onClose}>
          Cancel
        </BaseButton>
        <BaseButton variant="secondary" size="md" onClick={handleSave} disabled={!name.trim()}>
          {isEditing ? 'Save Changes' : 'Create Component'}
        </BaseButton>
      </footer>
    </div>
  )
}
