import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

const tiptapContent = z.record(z.string(), z.unknown()).optional().nullable()
  .describe('Rich text content as Tiptap JSON (editor.getJSON() format). Supports {{variationName.fieldName}} interpolation. Pass null or omit for empty node.')

registerTool({
  name: 'node.create',
  description: 'Adds a new generic story node to a narrative. Returns the node ID.',
  schema: {
    narrativeId: z.string().describe('ID of the narrative to add the node to.'),
    content: tiptapContent
  },
  handler: async ({ narrativeId, content }) => {
    const result = await ipcBridge.invoke('node:create', { narrativeId, content: content ?? null })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'node.create-from-variation',
  description: 'Creates a variation-backed story node in a narrative (equivalent to dragging a variation onto the canvas). Returns the node ID.',
  schema: {
    narrativeId: z.string().describe('ID of the narrative to add the node to.'),
    variationId: z.string().describe('ID of the variation to back this node.'),
    content: tiptapContent
  },
  handler: async ({ narrativeId, variationId, content }) => {
    const result = await ipcBridge.invoke('node:createFromVariation', { narrativeId, variationId, content: content ?? null })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'node.update',
  description: "Updates a node's metadata, including assigning or replacing its associated variation reference.",
  schema: {
    nodeId: z.string().describe('ID of the node to update.'),
    variationId: z.string().nullable().describe('ID of the variation to associate with this node. Pass null to remove the current association.')
  },
  handler: async ({ nodeId, variationId }) => {
    const result = await ipcBridge.invoke('node:update', { nodeId, variationId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'node.set-start',
  description: "Designates a node as the starting node of its narrative.",
  schema: {
    nodeId: z.string().describe('ID of the node to designate as the start node.')
  },
  handler: async ({ nodeId }) => {
    const result = await ipcBridge.invoke('node:setStart', { nodeId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'node.delete',
  description: 'Removes a story node from its narrative. All edges connected to the deleted node are also removed.',
  schema: {
    nodeId: z.string().describe('ID of the node to delete.')
  },
  handler: async ({ nodeId }) => {
    const result = await ipcBridge.invoke('node:delete', { nodeId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
