import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'variation.create',
  description:
    'Creates a new named variation under a component. Variation names must be unique project-wide.',
  schema: {
    componentId: z.string().describe('ID of the parent component.'),
    name: z
      .string()
      .min(1)
      .describe(
        'Unique project-wide name for this variation. Must not match any existing variation name.'
      ),
    values: z
      .record(z.string(), z.union([z.string(), z.number()]))
      .optional()
      .describe(
        'Field values for this variation. Keys are field names defined in the component schema. Extra keys are ignored; missing keys default to empty string or 0.'
      )
  },
  handler: async ({ componentId, name, values }) => {
    const result = await ipcBridge.invoke('variation:create', {
      componentId,
      name,
      values: values ?? {}
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'variation.edit',
  description:
    'Edits an existing variation. You may rename it and/or update its field values. Providing a `name` will attempt a project‑wide unique rename; `values` merges with the current value set.',
  schema: {
    variationId: z.string().describe('ID of the variation to modify.'),
    name: z.string().min(1).optional().describe('New name for the variation (must remain unique).'),
    values: z
      .record(z.string(), z.union([z.string(), z.number()]))
      .optional()
      .describe('Updated field values; will be merged with existing ones.')
  },
  handler: async ({ variationId, name, values }) => {
    const result = await ipcBridge.invoke('variation:edit', {
      variationId,
      name,
      values: values ?? {}
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'variation.delete',
  description:
    'Deletes a variation by ID. Any nodes referencing this variation will lose their association.',
  schema: {
    variationId: z.string().describe('ID of the variation to remove.')
  },
  handler: async ({ variationId }) => {
    const result = await ipcBridge.invoke('variation:delete', { variationId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
