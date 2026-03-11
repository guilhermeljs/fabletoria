import type { EntityId } from './ids'
export type { EntityId }

// ── Narrative ────────────────────────────────────────────────────────────────

export interface Narrative {
  id: EntityId
  name: string
  startNodeId: EntityId | null
  createdAt: number
  updatedAt: number
}

// ── StoryNode ────────────────────────────────────────────────────────────────

export interface StoryNode {
  id: EntityId
  narrativeId: EntityId
  /** Plain text title shown in the node header */
  title: string
  /** Tiptap JSON serialised as string via JSON.stringify(editor.getJSON()) */
  content: string
  position: { x: number; y: number }
  width?: number
  height?: number
  /** If set, this node was created from a variation drag-drop */
  variationId: EntityId | null
  createdAt: number
  updatedAt: number
}

// ── Connection ───────────────────────────────────────────────────────────────

export interface Connection {
  id: EntityId
  narrativeId: EntityId
  sourceNodeId: EntityId
  targetNodeId: EntityId
  /** Handle id used on the source node when the edge was created */
  sourceHandle?: string | null
  /** Handle id used on the target node when the edge was created */
  targetHandle?: string | null
  label?: string | null  // Choice label for Play Mode (Feature 002)
  createdAt: number
  updatedAt: number
}

// ── Component ────────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number'

export interface FieldSchema {
  name: string
  type: FieldType
}

export interface Component {
  id: EntityId
  name: string
  schema: FieldSchema[]
  /** Default values copied to new variations (always includes 'title' and 'content') */
  defaults: Record<string, string>
  createdAt: number
  updatedAt: number
}

// ── Variation ────────────────────────────────────────────────────────────────

export interface Variation {
  id: EntityId
  componentId: EntityId,
  defaultContent: string,
  defaultTitle: string,
  /** Project-wide unique name */
  name: string
  values: Record<string, string | number>
  createdAt: number
  updatedAt: number
}

// ── Asset ─────────────────────────────────────────────────────────────────────

export interface Asset {
  id: string
  name: string
  type: 'image' | 'document' | 'text'
  extension: string
  mimeType: string
  sourceType: 'local' | 'url'
  data: Blob | null
  url: string | null
  folder: string
  size: number
  status: 'uploading' | 'ready'
  uploadProgress: number
  createdAt: number
  updatedAt: number
}

export type AssetMap = Record<string, Asset>

// ── Store entity maps ────────────────────────────────────────────────────────

export type NarrativeMap = Record<EntityId, Narrative>
export type StoryNodeMap = Record<EntityId, StoryNode>
export type ConnectionMap = Record<EntityId, Connection>
export type ComponentMap = Record<EntityId, Component>
export type VariationMap = Record<EntityId, Variation>
