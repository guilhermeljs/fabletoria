import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'variation.create',
  description: 'Creates a new named variation under a component. Variation names must be unique project-wide.',
  schema: {
    componentId: z.string().describe('ID of the parent component.'),
    name: z.string().min(1).describe('Unique project-wide name for this variation. Must not match any existing variation name.'),
    values: z.record(z.string(), z.union([z.string(), z.number()])).optional()
      .describe("Field values for this variation. Keys are field names defined in the component schema. Extra keys are ignored; missing keys default to empty string or 0.")
  },
  handler: async ({ componentId, name, values }) => {
    const result = await ipcBridge.invoke('variation:create', { componentId, name, values: values ?? {} })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
