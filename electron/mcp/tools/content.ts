import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'content.edit',
  description: "Replaces the Tiptap JSON content of a story node. Accepts Tiptap JSON (editor.getJSON() format). Any Tiptap extension (images, embeds, etc.) is automatically supported. Supports {{variationName.fieldName}} interpolation syntax.",
  schema: {
    nodeId: z.string().describe('ID of the node to update.'),
    content: z.record(z.string(), z.unknown())
      .describe('New content as Tiptap JSON (editor.getJSON() format). Supports {{variationName.fieldName}} interpolation. Unresolved references are accepted.')
  },
  handler: async ({ nodeId, content }) => {
    const result = await ipcBridge.invoke('node:editContent', { nodeId, content })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
