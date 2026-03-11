// MCP IPC bridge — renderer side
// Listens for mutation requests from the Electron main process (via tool handlers)
// and dispatches them to the Zustand project store.
// Call initMcpBridge() once in src/main.tsx (only in Electron builds).

import { useProjectStore } from './project-store'

interface ElectronAPIWithMcp {
  mcp: {
    onMutation: (
      handler: (channel: string, payload: unknown, replyChannel: string) => void
    ) => () => void
    sendReply: (replyChannel: string, result: unknown) => void
  }
}

function getAPI(): ElectronAPIWithMcp['mcp'] | null {
  const api = (window as unknown as { electronAPI?: ElectronAPIWithMcp })['electronAPI']
  return api?.mcp ?? null
}

function reply(replyChannel: string, result: unknown): void {
  getAPI()?.sendReply(replyChannel, result)
}

function ok(data: Record<string, unknown>): { ok: true } & Record<string, unknown> {
  return { ok: true, ...data }
}

function err(code: string, message: string): { ok: false; code: string; message: string } {
  return { ok: false, code, message }
}

export function initMcpBridge(): (() => void) | undefined {
  const api = getAPI()
  if (!api) return undefined

  const cleanup = api.onMutation((channel, rawPayload, replyChannel) => {
    const payload = rawPayload as Record<string, unknown>
    const store = useProjectStore.getState()

    try {
      switch (channel) {
        case 'narrative:create': {
          const name = payload['name'] as string
          if (!name || name.trim() === '') {
            reply(replyChannel, err('VALIDATION_ERROR', 'Narrative name cannot be empty'))
            break
          }
          const narrative = store.createNarrative(name.trim())
          reply(replyChannel, ok({ narrativeId: narrative.id, name: narrative.name }))
          break
        }

        case 'node:create': {
          const narrativeId = payload['narrativeId'] as string
          const title = payload['title'] as string | null | undefined
          const contentRaw = payload['content'] as Record<string, unknown> | null | undefined
          if (!store.narratives[narrativeId]) {
            reply(replyChannel, err('NOT_FOUND', `Narrative '${narrativeId}' not found`))
            break
          }
          const nodeOpts = {
            ...(title ? { title } : {}),
            ...(contentRaw ? { content: JSON.stringify(contentRaw) } : {})
          }
          const node = store.createNode(narrativeId, nodeOpts)
          reply(replyChannel, ok({ nodeId: node.id, narrativeId: node.narrativeId }))
          break
        }

        case 'node:createFromVariation': {
          const narrativeId = payload['narrativeId'] as string
          const variationId = payload['variationId'] as string
          const title = payload['title'] as string | null | undefined
          const contentRaw = payload['content'] as Record<string, unknown> | null | undefined
          if (!store.narratives[narrativeId]) {
            reply(replyChannel, err('NOT_FOUND', `Narrative '${narrativeId}' not found`))
            break
          }
          if (!store.variations[variationId]) {
            reply(replyChannel, err('NOT_FOUND', `Variation '${variationId}' not found`))
            break
          }
          const nodeOpts = {
            variationId,
            ...(title ? { title } : {}),
            ...(contentRaw ? { content: JSON.stringify(contentRaw) } : {})
          }
          const node = store.createNode(narrativeId, nodeOpts)
          reply(replyChannel, ok({ nodeId: node.id, narrativeId: node.narrativeId, variationId }))
          break
        }

        case 'node:update': {
          const nodeId = payload['nodeId'] as string
          const variationId = payload['variationId'] as string | null
          if (!store.nodes[nodeId]) {
            reply(replyChannel, err('NOT_FOUND', `Node '${nodeId}' not found`))
            break
          }
          if (variationId !== null && variationId !== undefined && !store.variations[variationId]) {
            reply(replyChannel, err('NOT_FOUND', `Variation '${variationId}' not found`))
            break
          }
          // Update variation association — directly patch the store for variationId
          useProjectStore.setState((s) => ({
            nodes: {
              ...s.nodes,
              [nodeId]: { ...s.nodes[nodeId]!, variationId: variationId ?? null, updatedAt: Date.now() }
            }
          }))
          reply(replyChannel, ok({ nodeId, variationId: variationId ?? null }))
          break
        }

        case 'node:setStart': {
          const nodeId = payload['nodeId'] as string
          const node = store.nodes[nodeId]
          if (!node) {
            reply(replyChannel, err('NOT_FOUND', `Node '${nodeId}' not found`))
            break
          }
          store.setStartNode(node.narrativeId, nodeId)
          reply(replyChannel, ok({ nodeId, narrativeId: node.narrativeId }))
          break
        }

        case 'node:delete': {
          const nodeId = payload['nodeId'] as string
          if (!store.nodes[nodeId]) {
            reply(replyChannel, err('NOT_FOUND', `Node '${nodeId}' not found`))
            break
          }
          // Count connected edges before deletion
          const relatedEdges = Object.values(store.connections).filter(
            (c) => c.sourceNodeId === nodeId || c.targetNodeId === nodeId
          )
          store.deleteNode(nodeId)
          reply(replyChannel, ok({ deletedNodeId: nodeId, deletedEdgeCount: relatedEdges.length }))
          break
        }

        case 'edge:create': {
          const { narrativeId, sourceNodeId, targetNodeId, label } = payload as {
            narrativeId: string
            sourceNodeId: string
            targetNodeId: string
            label: string | null
          }
          const sourceNode = store.nodes[sourceNodeId]
          const targetNode = store.nodes[targetNodeId]
          if (!sourceNode) {
            reply(replyChannel, err('NOT_FOUND', `Node '${sourceNodeId}' not found in narrative '${narrativeId}'`))
            break
          }
          if (!targetNode) {
            reply(replyChannel, err('NOT_FOUND', `Node '${targetNodeId}' not found in narrative '${narrativeId}'`))
            break
          }
          if (sourceNode.narrativeId !== targetNode.narrativeId) {
            reply(replyChannel, err('VALIDATION_ERROR', 'Cannot connect nodes from different narratives'))
            break
          }
          const connection = store.createConnection(sourceNodeId, targetNodeId)
          if (!connection) {
            reply(replyChannel, err('VALIDATION_ERROR', 'Could not create connection'))
            break
          }
          // Store label if provided — extend connection with label
          if (label) {
            useProjectStore.setState((s) => ({
              connections: {
                ...s.connections,
                [connection.id]: { ...s.connections[connection.id]!, label, updatedAt: Date.now() }
              }
            }))
          }
          reply(replyChannel, ok({ connectionId: connection.id, sourceNodeId, targetNodeId }))
          break
        }

        case 'edge:delete': {
          const connectionId = payload['connectionId'] as string
          if (!store.connections[connectionId]) {
            reply(replyChannel, err('NOT_FOUND', `Connection '${connectionId}' not found`))
            break
          }
          store.deleteConnection(connectionId)
          reply(replyChannel, ok({ deletedConnectionId: connectionId }))
          break
        }

        case 'component:create': {
          const name = payload['name'] as string
          const schema = payload['schema'] as Array<{ name: string; type: 'string' | 'number' }>
          if (!name || name.trim() === '') {
            reply(replyChannel, err('VALIDATION_ERROR', 'Component name cannot be empty'))
            break
          }
          if (!schema || schema.length === 0) {
            reply(replyChannel, err('INVALID_SCHEMA', 'Component schema must define at least one field'))
            break
          }
          for (const field of schema) {
            if (field.type !== 'string' && field.type !== 'number') {
              reply(replyChannel, err('INVALID_SCHEMA', `Field '${field.name}' has invalid type '${field.type}' — must be 'string' or 'number'`))
              break
            }
          }
          const component = store.createComponent(name.trim(), { schema })
          reply(replyChannel, ok({ componentId: component.id, name: component.name, fieldCount: component.schema.length }))
          break
        }

        case 'variation:create': {
          const { componentId, name, values } = payload as {
            componentId: string
            name: string
            values: Record<string, string | number>
          }
          if (!store.components[componentId]) {
            reply(replyChannel, err('NOT_FOUND', `Component '${componentId}' not found`))
            break
          }
          const result = store.createVariation(componentId, name, values ?? {})
          if ('error' in result) {
            reply(replyChannel, err('DUPLICATE_NAME', `Variation name '${name}' already exists — choose a different name`))
          } else {
            reply(replyChannel, ok({ variationId: result.variation.id, name: result.variation.name, componentId }))
          }
          break
        }

        case 'node:editContent': {
          const nodeId = payload['nodeId'] as string
          const content = payload['content'] as Record<string, unknown>
          if (!store.nodes[nodeId]) {
            reply(replyChannel, err('NOT_FOUND', `Node '${nodeId}' not found`))
            break
          }
          store.updateNodeContent(nodeId, JSON.stringify(content))
          reply(replyChannel, ok({ nodeId }))
          break
        }

        default:
          reply(replyChannel, err('UNKNOWN_CHANNEL', `Unknown channel: ${channel}`))
      }
    } catch (e) {
      reply(replyChannel, err('INTERNAL_ERROR', e instanceof Error ? e.message : String(e)))
    }
  })

  return cleanup
}
