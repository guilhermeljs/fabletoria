import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'narrative.create',
  description:
    'Creates a new named narrative within the project. Returns the narrative ID for use in subsequent tool calls.',
  schema: {
    name: z.string().min(1).describe('Name for the new narrative. Must be non-empty.')
  },
  handler: async ({ name }) => {
    const result = await ipcBridge.invoke('narrative:create', { name })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
