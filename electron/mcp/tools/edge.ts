import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

registerTool({
  name: 'edge.create',
  description:
    'Creates a directed edge between two nodes in the same narrative. The label appears in Play Mode as the choice text.',
  schema: {
    narrativeId: z.string().describe('ID of the narrative containing both nodes.'),
    sourceNodeId: z.string().describe('ID of the source (outgoing) node.'),
    targetNodeId: z.string().describe('ID of the target (incoming) node.'),
    label: z
      .string()
      .optional()
      .nullable()
      .describe(
        "Optional choice label displayed in Play Mode. Falls back to 'Choice N' if omitted."
      )
  },
  handler: async ({ narrativeId, sourceNodeId, targetNodeId, label }) => {
    const result = await ipcBridge.invoke('edge:create', {
      narrativeId,
      sourceNodeId,
      targetNodeId,
      label: label ?? null
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'edge.delete',
  description:
    'Removes a specific directed connection between two nodes without affecting the nodes themselves.',
  schema: {
    connectionId: z.string().describe('ID of the connection to delete.')
  },
  handler: async ({ connectionId }) => {
    const result = await ipcBridge.invoke('edge:delete', { connectionId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
