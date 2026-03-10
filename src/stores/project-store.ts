import { create } from 'zustand'
import { temporal } from 'zundo'
import { db, checkStorageQuota } from '../lib/db'
import { newId } from '../lib/ids'
import type {
  EntityId,
  Narrative,
  StoryNode,
  Connection,
  Component,
  FieldSchema,
  Variation,
  NarrativeMap,
  StoryNodeMap,
  ConnectionMap,
  ComponentMap,
  VariationMap
} from '../lib/types'

// ── State shape ──────────────────────────────────────────────────────────────

export interface ProjectState {
  narratives: NarrativeMap
  nodes: StoryNodeMap
  connections: ConnectionMap
  components: ComponentMap
  variations: VariationMap

  // ── Narrative actions ─────────────────────────────────────────────────────
  createNarrative: (name: string) => Narrative
  renameNarrative: (id: EntityId, name: string) => void
  deleteNarrative: (id: EntityId) => void
  ensureDefaultNarrative: () => Narrative

  // ── Node actions ──────────────────────────────────────────────────────────
  createNode: (
    narrativeId: EntityId,
    opts?: { position?: { x: number; y: number }; variationId?: EntityId; title?: string; content?: string }
  ) => StoryNode
  updateNodeContent: (id: EntityId, content: string) => void
  updateNodeTitle: (id: EntityId, title: string) => void
  updateNodePosition: (id: EntityId, position: { x: number; y: number }) => void
  deleteNode: (id: EntityId) => void
  setStartNode: (narrativeId: EntityId, nodeId: EntityId | null) => void

  // ── Connection actions ────────────────────────────────────────────────────
  createConnection: (sourceNodeId: EntityId, targetNodeId: EntityId, sourceHandle?: string | null) => Connection | null
  updateConnectionHandle: (id: EntityId, sourceHandle: string) => void
  deleteConnection: (id: EntityId) => void

  // ── Component actions ─────────────────────────────────────────────────────
  createComponent: (name: string, opts?: { schema?: FieldSchema[]; defaults?: Record<string, string> }) => Component
  renameComponent: (id: EntityId, name: string) => void
  updateComponentSchema: (id: EntityId, schema: FieldSchema[]) => void
  updateComponentDefaults: (id: EntityId, defaults: Record<string, string>) => void
  deleteComponent: (id: EntityId) => void

  // ── Variation actions ─────────────────────────────────────────────────────
  createVariation: (
    componentId: EntityId,
    name: string,
    values?: Record<string, string | number>,
    defaultContent?: string,
    defaultTitle?: string
  ) => { variation: Variation } | { error: string }
  renameVariation: (id: EntityId, name: string) => { ok: boolean } | { error: string }
  updateVariationDefaultTitle: (id: EntityId, defaultTitle: string) => void
  updateVariationDefaultContent: (id: EntityId, defaultContent: string) => void
  updateVariationValues: (id: EntityId, values: Record<string, string | number>) => void
  deleteVariation: (id: EntityId) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function now(): number {
  return Date.now()
}

function persist(fn: () => Promise<void>): void {
  fn().then(() => checkStorageQuota()).catch(console.error)
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>()(
  temporal((set, get) => ({
    narratives: {},
    nodes: {},
    connections: {},
    components: {},
    variations: {},

    // ── Narrative ─────────────────────────────────────────────────────────

    createNarrative(name) {
      const narrative: Narrative = {
        id: newId(),
        name,
        startNodeId: null,
        createdAt: now(),
        updatedAt: now()
      }
      set((s) => ({ narratives: { ...s.narratives, [narrative.id]: narrative } }))
      persist(() => db.narratives.put(narrative))
      return narrative
    },

    renameNarrative(id, name) {
      const ts = now()
      set((s) => {
        const narrative = s.narratives[id]
        if (!narrative) return s
        return { narratives: { ...s.narratives, [id]: { ...narrative, name, updatedAt: ts } } }
      })
      persist(async () => {
        await db.narratives.update(id, { name, updatedAt: ts })
      })
    },

    deleteNarrative(id) {
      const { nodes, connections } = get()
      const nodeIds = Object.keys(nodes).filter((nid) => nodes[nid]?.narrativeId === id)
      const connectionIds = Object.keys(connections).filter(
        (cid) => connections[cid]?.narrativeId === id
      )

      set((s) => {
        const newNarratives = { ...s.narratives }
        delete newNarratives[id]
        const newNodes = { ...s.nodes }
        nodeIds.forEach((nid) => delete newNodes[nid])
        const newConnections = { ...s.connections }
        connectionIds.forEach((cid) => delete newConnections[cid])
        return { narratives: newNarratives, nodes: newNodes, connections: newConnections }
      })

      persist(async () => {
        await db.transaction('rw', [db.narratives, db.nodes, db.connections], async () => {
          await db.narratives.delete(id)
          await db.nodes.bulkDelete(nodeIds)
          await db.connections.bulkDelete(connectionIds)
        })
      })
    },

    ensureDefaultNarrative() {
      const existing = Object.values(get().narratives)
      if (existing.length > 0) return existing[0]!
      return get().createNarrative('My Narrative')
    },

    // ── Node ─────────────────────────────────────────────────────────────

    createNode(narrativeId, opts = {}) {
      const { variations } = get()
      const variation = opts.variationId ? variations[opts.variationId] : undefined
      const node: StoryNode = {
        id: newId(),
        narrativeId,
        title: opts.title ?? variation?.defaultTitle ?? '',
        content: opts.content ?? variation?.defaultContent ?? JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        position: opts.position ?? { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        variationId: opts.variationId ?? null,
        createdAt: now(),
        updatedAt: now()
      }
      set((s) => ({ nodes: { ...s.nodes, [node.id]: node } }))
      persist(() => db.nodes.put(node))
      return node
    },

    updateNodeContent(id, content) {
      const ts = now()
      set((s) => {
        const node = s.nodes[id]
        if (!node) return s
        return { nodes: { ...s.nodes, [id]: { ...node, content, updatedAt: ts } } }
      })
      persist(async () => {
        await db.nodes.update(id, { content, updatedAt: ts })
      })
    },

    updateNodeTitle(id, title) {
      const ts = now()
      set((s) => {
        const node = s.nodes[id]
        if (!node) return s
        return { nodes: { ...s.nodes, [id]: { ...node, title, updatedAt: ts } } }
      })
      persist(async () => {
        await db.nodes.update(id, { title, updatedAt: ts })
      })
    },

    updateNodePosition(id, position) {
      const ts = now()
      set((s) => {
        const node = s.nodes[id]
        if (!node) return s
        return { nodes: { ...s.nodes, [id]: { ...node, position, updatedAt: ts } } }
      })
      persist(async () => {
        await db.nodes.update(id, { position, updatedAt: ts })
      })
    },

    deleteNode(id) {
      const { connections, narratives } = get()
      const relatedConnectionIds = Object.keys(connections).filter(
        (cid) => connections[cid]?.sourceNodeId === id || connections[cid]?.targetNodeId === id
      )

      set((s) => {
        const newNodes = { ...s.nodes }
        delete newNodes[id]
        const newConnections = { ...s.connections }
        relatedConnectionIds.forEach((cid) => delete newConnections[cid])

        // Clear startNodeId references
        const newNarratives = { ...s.narratives }
        for (const nid of Object.keys(newNarratives)) {
          const n = newNarratives[nid]
          if (n?.startNodeId === id) {
            newNarratives[nid] = { ...n, id: n.id, name: n.name, startNodeId: null, createdAt: n.createdAt, updatedAt: now() }
          }
        }

        return { nodes: newNodes, connections: newConnections, narratives: newNarratives }
      })

      // Suppress the narrative that had this as start
      const affectedNarratives = Object.values(narratives).filter((n) => n.startNodeId === id)

      persist(async () => {
        await db.transaction('rw', [db.nodes, db.connections, db.narratives], async () => {
          await db.nodes.delete(id)
          await db.connections.bulkDelete(relatedConnectionIds)
          for (const n of affectedNarratives) {
            await db.narratives.update(n.id, { startNodeId: null, updatedAt: now() })
          }
        })
      })
    },

    setStartNode(narrativeId, nodeId) {
      const ts = now()
      set((s) => {
        const narrative = s.narratives[narrativeId]
        if (!narrative) return s
        return {
          narratives: { ...s.narratives, [narrativeId]: { ...narrative, startNodeId: nodeId, updatedAt: ts } }
        }
      })
      persist(async () => {
        await db.narratives.update(narrativeId, { startNodeId: nodeId, updatedAt: ts })
      })
    },

    // ── Connection ───────────────────────────────────────────────────────

    createConnection(sourceNodeId, targetNodeId, sourceHandle) {
      const { nodes } = get()
      const sourceNode = nodes[sourceNodeId]
      const targetNode = nodes[targetNodeId]
      if (!sourceNode || !targetNode) return null
      if (sourceNode.narrativeId !== targetNode.narrativeId) return null

      const connection: Connection = {
        id: newId(),
        narrativeId: sourceNode.narrativeId,
        sourceNodeId,
        targetNodeId,
        sourceHandle: sourceHandle ?? null,
        createdAt: now(),
        updatedAt: now()
      }
      set((s) => ({ connections: { ...s.connections, [connection.id]: connection } }))
      persist(() => db.connections.put(connection))
      return connection
    },

    updateConnectionHandle(id, sourceHandle) {
      set((s) => {
        const conn = s.connections[id]
        if (!conn) return s
        const updated = { ...conn, sourceHandle, updatedAt: now() }
        return { connections: { ...s.connections, [id]: updated } }
      })
      persist(async () => {
        await db.connections.update(id, { sourceHandle, updatedAt: now() })
      })
    },

    deleteConnection(id) {
      set((s) => {
        const newConnections = { ...s.connections }
        delete newConnections[id]
        return { connections: newConnections }
      })
      persist(async () => {
        await db.connections.delete(id)
      })
    },

    // ── Component ────────────────────────────────────────────────────────

    createComponent(name, opts = {}) {
      const component: Component = {
        id: newId(),
        name,
        schema: opts.schema ?? [],
        defaults: { title: '', content: '', ...opts.defaults },
        createdAt: now(),
        updatedAt: now()
      }
      set((s) => ({ components: { ...s.components, [component.id]: component } }))
      persist(() => db.components.put(component))
      return component
    },

    renameComponent(id, name) {
      const ts = now()
      set((s) => {
        const component = s.components[id]
        if (!component) return s
        return { components: { ...s.components, [id]: { ...component, name, updatedAt: ts } } }
      })
      persist(async () => {
        await db.components.update(id, { name, updatedAt: ts })
      })
    },

    updateComponentSchema(id, schema) {
      const ts = now()
      set((s) => {
        const component = s.components[id]
        if (!component) return s
        return { components: { ...s.components, [id]: { ...component, schema, updatedAt: ts } } }
      })
      persist(async () => {
        await db.components.update(id, { schema, updatedAt: ts })
      })
    },

    updateComponentDefaults(id, defaults) {
      const ts = now()
      set((s) => {
        const component = s.components[id]
        if (!component) return s
        return { components: { ...s.components, [id]: { ...component, defaults: { ...component.defaults, ...defaults }, updatedAt: ts } } }
      })
      persist(async () => {
        const existing = await db.components.get(id)
        if (!existing) return
        await db.components.update(id, { defaults: { ...(existing.defaults ?? {}), ...defaults }, updatedAt: ts })
      })
    },

    deleteComponent(id) {
      const { variations } = get()
      const variationIds = Object.keys(variations).filter((vid) => variations[vid]?.componentId === id)
      set((s) => {
        const newComponents = { ...s.components }
        delete newComponents[id]
        const newVariations = { ...s.variations }
        variationIds.forEach((vid) => delete newVariations[vid])
        return { components: newComponents, variations: newVariations }
      })
      persist(async () => {
        await db.transaction('rw', [db.components, db.variations], async () => {
          await db.components.delete(id)
          await db.variations.bulkDelete(variationIds)
        })
      })
    },

    // ── Variation ────────────────────────────────────────────────────────

    createVariation(componentId, name, values, defaultContent = '', defaultTitle = '') {
      const { variations, components } = get()
      const isDuplicate = Object.values(variations).some((v) => v.name === name)
      if (isDuplicate) {
        return { error: `A variation named "${name}" already exists in this project.` }
      }

      const component = components[componentId]
      const defaultValues: Record<string, string | number> = {
        title: '',
        content: '',
        ...(component?.defaults ?? {})
      }

      const variation: Variation = {
        id: newId(),
        componentId,
        name,
        defaultContent,
        defaultTitle,
        values: { ...defaultValues, ...(values ?? {}) },
        createdAt: now(),
        updatedAt: now()
      }
      set((s) => ({ variations: { ...s.variations, [variation.id]: variation } }))
      persist(() => db.variations.put(variation))
      return { variation }
    },

    

    updateVariationDefaultTitle(id, defaultTitle) {
      const ts = now()
      set((s) => {
        const variation = s.variations[id]
        if (!variation) return s
        return { variations: { ...s.variations, [id]: { ...variation, defaultTitle, updatedAt: ts } } }
      })
      persist(async () => {
        await db.variations.update(id, { defaultTitle, updatedAt: ts })
      })
    },

    updateVariationDefaultContent(id, defaultContent) {
      const ts = now()
      set((s) => {
        const variation = s.variations[id]
        if (!variation) return s
        return { variations: { ...s.variations, [id]: { ...variation, defaultContent, updatedAt: ts } } }
      })
      persist(async () => {
        await db.variations.update(id, { defaultContent, updatedAt: ts })
      })
    },

    renameVariation(id, name) {
      const { variations } = get()
      const isDuplicate = Object.values(variations).some((v) => v.id !== id && v.name === name)
      if (isDuplicate) {
        return { error: `A variation named "${name}" already exists in this project.` }
      }

      const ts = now()
      set((s) => {
        const variation = s.variations[id]
        if (!variation) return s
        return { variations: { ...s.variations, [id]: { ...variation, name, updatedAt: ts } } }
      })
      persist(async () => {
        await db.variations.update(id, { name, updatedAt: ts })
      })
      return { ok: true }
    },

    updateVariationValues(id, values) {
      const ts = now()
      set((s) => {
        const variation = s.variations[id]
        if (!variation) return s
        return {
          variations: {
            ...s.variations,
            [id]: { ...variation, values: { ...variation.values, ...values }, updatedAt: ts }
          }
        }
      })
      persist(async () => {
        const existing = await db.variations.get(id)
        if (!existing) return
        await db.variations.update(id, {
          values: { ...existing.values, ...values },
          updatedAt: ts
        })
      })
    },

    deleteVariation(id) {
      set((s) => {
        const newVariations = { ...s.variations }
        delete newVariations[id]
        return { variations: newVariations }
      })
      persist(async () => {
        await db.variations.delete(id)
      })
    }
  }))
)
