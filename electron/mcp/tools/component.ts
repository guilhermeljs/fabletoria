import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'component.create',
  description:
    'Creates a new named component with a field schema. Components define the structure of variations.',
  schema: {
    name: z.string().min(1).describe('Name for the component. Must be non-empty.'),
    schema: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.enum(['string', 'number'])
        })
      )
      .min(1)
      .describe(
        "Field definitions. Must contain at least one field. Each field has 'name' (string) and 'type' ('string' or 'number')."
      )
  },
  handler: async ({ name, schema }) => {
    const result = await ipcBridge.invoke('component:create', { name, schema })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
