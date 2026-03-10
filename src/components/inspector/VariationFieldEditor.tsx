import { useProjectStore } from '../../stores/project-store'
import type { EntityId } from '../../lib/types'

interface VariationFieldEditorProps {
  variationId: EntityId
}

export default function VariationFieldEditor({ variationId }: VariationFieldEditorProps) {
  const variation = useProjectStore((s) => s.variations[variationId])
  const component = useProjectStore((s) => (variation ? s.components[variation.componentId] : null))
  const updateVariationValues = useProjectStore((s) => s.updateVariationValues)

  if (!variation || !component) return null

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{component.name}</span>
        <span className="text-xs text-violet-400">{variation.name}</span>
      </div>

      {/* Custom schema fields */}
      {component.schema.length > 0 && (
        <>
          <div className="border-t border-zinc-700 mt-1" />
          <div className="flex flex-col gap-2">
            {component.schema.map((field) => (
              <div key={field.name} className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 w-24 shrink-0">{field.name}</label>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={String(variation.values[field.name] ?? '')}
                  onChange={(e) => {
                    const value = field.type === 'number' ? Number(e.target.value) : e.target.value
                    updateVariationValues(variationId, { [field.name]: value })
                  }}
                  className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {component.schema.length === 0 && (
        <p className="text-xs text-zinc-600 italic">No custom fields. Edit schema in the Explorer.</p>
      )}
    </div>
  )
}
