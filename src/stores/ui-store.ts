import { create } from 'zustand'
import type { EntityId, Asset } from '../lib/types'

const ACTIVE_NARRATIVE_KEY = 'narrativeflow:activeNarrativeId'

export type SelectionItem =
  | { type: 'node'; id: EntityId }
  | { type: 'edge'; id: EntityId }
  | { type: 'variation'; id: EntityId }

interface UIState {
  activeNarrativeId: EntityId | null
  selection: SelectionItem[]
  inspectorOpen: boolean

  // Derived: ID only when exactly one item of that type is selected
  singleSelectedNodeId: EntityId | null
  singleSelectedEdgeId: EntityId | null
  singleSelectedVariationId: EntityId | null

  // Asset Manager
  assetManagerOpen: boolean
  assetManagerMode: 'browse' | 'select'
  assetManagerInsertCallback: ((asset: Asset) => void) | null
  activeFolder: string

  setActiveNarrative: (id: EntityId | null) => void

  setSelection: (items: SelectionItem[]) => void
  addToSelection: (item: SelectionItem) => void
  removeFromSelection: (id: EntityId) => void
  clearSelection: () => void

  // Convenience: set a single item as the entire selection
  setSelectedNode: (id: EntityId) => void
  setSelectedEdge: (id: EntityId) => void
  setSelectedVariation: (id: EntityId | null) => void

  toggleInspector: () => void
  openInspector: () => void

  // Asset Manager actions
  openAssetManager: (mode: 'browse' | 'select', callback?: (asset: Asset) => void) => void
  closeAssetManager: () => void
  setActiveFolder: (folder: string) => void
}

function deriveSingles(selection: SelectionItem[]) {
  const nodes = selection.filter((s) => s.type === 'node')
  const edges = selection.filter((s) => s.type === 'edge')
  const variations = selection.filter((s) => s.type === 'variation')
  return {
    singleSelectedNodeId: nodes.length === 1 ? nodes[0]!.id : null,
    singleSelectedEdgeId: edges.length === 1 ? edges[0]!.id : null,
    singleSelectedVariationId: variations.length === 1 ? variations[0]!.id : null,
  }
}

export const useUIStore = create<UIState>()((set) => ({
  activeNarrativeId: null,
  selection: [],
  inspectorOpen: false,
  singleSelectedNodeId: null,
  singleSelectedEdgeId: null,
  singleSelectedVariationId: null,
  assetManagerOpen: false,
  assetManagerMode: 'browse' as const,
  assetManagerInsertCallback: null,
  activeFolder: '/',

  setActiveNarrative(id) {
    set({ activeNarrativeId: id, selection: [], ...deriveSingles([]) })
    if (id !== null) {
      localStorage.setItem(ACTIVE_NARRATIVE_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_NARRATIVE_KEY)
    }
  },

  setSelection(items) {
    set({ selection: items, ...deriveSingles(items) })
  },

  addToSelection(item) {
    set((s) => {
      const isNodeOrEdge = (t: string) => t === 'node' || t === 'edge'
      const isVariation = (t: string) => t === 'variation'

      // Prevent selecting nodes/edges together with variations, as that creates a lot of UI edge cases. Instead, if the new item is a variation, keep only the existing variations in the selection. If the new item is a node/edge, keep only the existing nodes/edges.
      if (
        (isNodeOrEdge(item.type) && s.selection.some((x) => isVariation(x.type))) ||
        (isVariation(item.type) && s.selection.some((x) => isNodeOrEdge(x.type)))
      ) {
        const keepType = item.type === 'variation' ? 'variation' : undefined

        const next = [
          ...s.selection.filter((x) =>
            keepType ? x.type === 'variation' : x.type !== 'variation'
          ),
          item
        ]

        return { selection: next, ...deriveSingles(next) }
      }

      const existing = s.selection.some((x) => x.id === item.id && x.type === item.type)
      if (existing) return s
      const next = [...s.selection, item]
      return { selection: next, ...deriveSingles(next) }
    })
  },

  removeFromSelection(id) {
    set((s) => {
      const next = s.selection.filter((x) => x.id !== id)
      return { selection: next, ...deriveSingles(next) }
    })
  },

  clearSelection() {
    set({ selection: [], ...deriveSingles([]) })
  },

  setSelectedNode(id) {
    const items: SelectionItem[] = [{ type: 'node', id }]
    set({ selection: items, ...deriveSingles(items) })
  },

  setSelectedEdge(id) {
    const items: SelectionItem[] = [{ type: 'edge', id }]
    set({ selection: items, ...deriveSingles(items) })
  },

  setSelectedVariation(id) {
    const items: SelectionItem[] = id ? [{ type: 'variation', id }] : []
    set({ selection: items, ...deriveSingles(items), inspectorOpen: id !== null })
  },

  toggleInspector() {
    set((s) => ({ inspectorOpen: !s.inspectorOpen }))
  },

  openInspector() {
    set({ inspectorOpen: true })
  },

  openAssetManager(mode, callback) {
    set({
      assetManagerOpen: true,
      assetManagerMode: mode,
      assetManagerInsertCallback: callback ?? null,
      activeFolder: '/'
    })
  },

  closeAssetManager() {
    set({
      assetManagerOpen: false,
      assetManagerInsertCallback: null
    })
  },

  setActiveFolder(folder) {
    set({ activeFolder: folder })
  }
}))

export const ACTIVE_NARRATIVE_STORAGE_KEY = ACTIVE_NARRATIVE_KEY
