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

// ── Store entity maps ────────────────────────────────────────────────────────

export type NarrativeMap = Record<EntityId, Narrative>
export type StoryNodeMap = Record<EntityId, StoryNode>
export type ConnectionMap = Record<EntityId, Connection>
export type ComponentMap = Record<EntityId, Component>
export type VariationMap = Record<EntityId, Variation>
