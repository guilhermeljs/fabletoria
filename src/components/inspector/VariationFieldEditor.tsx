import { useProjectStore } from '../../stores/project-store'
import type { EntityId } from '../../lib/types'
import { BaseText } from '../primitives/BaseText'
import { BaseBadge } from '../primitives/BaseBadge'
import { BaseInput } from '../primitives/BaseInput'

interface VariationFieldEditorProps {
  variationId: EntityId
}

export default function VariationFieldEditor({ variationId }: VariationFieldEditorProps) {
  const variation = useProjectStore((s) => s.variations[variationId])
  const component = useProjectStore((s) => (variation ? s.components[variation.componentId] : null))
  const updateVariationValues = useProjectStore((s) => s.updateVariationValues)

  if (!variation || !component) return null

  return (
    <div className="space-y-tk-4">
      <div className="flex items-center justify-between">
        <BaseText
          size="xs"
          variant="dim"
          weight="medium"
          className="uppercase tracking-wider text-text-dim"
        >
          {component.name}
        </BaseText>
        <BaseBadge variant="primary">{variation.name}</BaseBadge>
      </div>

      {/* Custom schema fields */}
      {component.schema.length > 0 && (
        <div className="space-y-tk-4">
          {component.schema.map((field) => (
            <BaseInput
              key={field.name}
              label={field.name}
              type={field.type === 'number' ? 'number' : 'text'}
              value={String(variation.values[field.name] ?? '')}
              onChange={(e) => {
                const value = field.type === 'number' ? Number(e.target.value) : e.target.value
                updateVariationValues(variationId, { [field.name]: value })
              }}
              fullWidth
            />
          ))}
        </div>
      )}

      {component.schema.length === 0 && (
        <BaseText size="xs" variant="dim" italic>
          No custom fields. Edit schema in the Explorer.
        </BaseText>
      )}
    </div>
  )
}
