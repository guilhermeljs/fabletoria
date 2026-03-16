import { z } from 'zod'
import { registerTool } from '../registry'
import { ipcBridge } from '../ipc-bridge'

// Central query toolbox for AI to inspect project state. Each handler returns
// structured JSON so that the model can understand narratives, nodes, edges,
// and other entities without needing to call multiple endpoints.

registerTool({
  name: 'query.listNarratives',
  description:
    'Returns an array of all narratives in the project. Each object is the raw store entry (id, name, startNodeId, timestamps).',
  schema: {},
  handler: async () => {
    const result = await ipcBridge.invoke('query:listNarratives', {})
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'query.listNodes',
  description:
    'Lists story nodes. Optional `narrativeId` filter may be provided to restrict to a particular narrative.',
  schema: {
    narrativeId: z
      .string()
      .optional()
      .describe('If provided, only nodes belonging to this narrative are returned.')
  },
  handler: async ({ narrativeId }) => {
    const result = await ipcBridge.invoke('query:listNodes', { narrativeId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'query.listEdges',
  description:
    'Returns all connections/edges. You can optionally supply a `narrativeId` to filter.',
  schema: {
    narrativeId: z
      .string()
      .optional()
      .describe('If set, only edges for that narrative are included.')
  },
  handler: async ({ narrativeId }) => {
    const result = await ipcBridge.invoke('query:listEdges', { narrativeId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'query.listComponents',
  description: 'Returns an array of all components defined in the project.',
  schema: {},
  handler: async () => {
    const result = await ipcBridge.invoke('query:listComponents', {})
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'query.listVariations',
  description: 'Lists variations. Optional `componentId` may filter by parent component.',
  schema: {
    componentId: z
      .string()
      .optional()
      .describe('If provided, only variations belonging to this component will be returned.')
  },
  handler: async ({ componentId }) => {
    const result = await ipcBridge.invoke('query:listVariations', { componentId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})

registerTool({
  name: 'query.readNarrative',
  description:
    'Provides a linearized view of a narrative for ML models. The response contains an object with narrativeId and a `linear` array; each entry corresponds to a card/node with its title, raw content, and outgoing choices (target node IDs and optional labels). This representation is intentionally less technical but still includes IDs so the model can refer back when editing.',
  schema: {
    narrativeId: z.string().describe('ID of the narrative to describe.')
  },
  handler: async ({ narrativeId }) => {
    const result = await ipcBridge.invoke('query:readNarrative', { narrativeId })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  }
})
