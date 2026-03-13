import Dexie, { type Table } from 'dexie'
import type { Narrative, StoryNode, Connection, Component, Variation, Asset, AppSettings } from './types'

export class FabletoriaDB extends Dexie {
  narratives!: Table<Narrative>
  nodes!: Table<StoryNode>
  connections!: Table<Connection>
  components!: Table<Component>
  variations!: Table<Variation>
  assets!: Table<Asset>
  settings!: Table<AppSettings>

  constructor() {
    super('FabletoriaDB')
    this.version(1).stores({
      narratives: '++id, updatedAt',
      nodes: '++id, narrativeId',
      connections: '++id, narrativeId, [narrativeId+sourceNodeId]',
      components: '++id',
      variations: '++id, componentId, name'
    })
    this.version(2).stores({
      narratives: '++id, updatedAt',
      nodes: '++id, narrativeId',
      connections: '++id, narrativeId, [narrativeId+sourceNodeId]',
      components: '++id',
      variations: '++id, componentId, name',
      assets: '++id, folder, type, sourceType'
    })
    this.version(3).stores({
      narratives: '++id, updatedAt',
      nodes: '++id, narrativeId',
      connections: '++id, narrativeId, [narrativeId+sourceNodeId]',
      components: '++id',
      variations: '++id, componentId, name',
      assets: '++id, folder, type, sourceType'
    })
    this.version(4).stores({
      narratives: '++id, updatedAt',
      nodes: '++id, narrativeId',
      connections: '++id, narrativeId, [narrativeId+sourceNodeId]',
      components: '++id',
      variations: '++id, componentId, name',
      assets: '++id, folder, type, sourceType',
      settings: 'id'
    })
  }
}

export const db = new FabletoriaDB()

const STORAGE_WARNING_THRESHOLD = 0.8

export async function checkStorageQuota(): Promise<void> {
  if (!navigator.storage?.estimate) return
  try {
    const { usage = 0, quota = 1 } = await navigator.storage.estimate()
    if (usage / quota > STORAGE_WARNING_THRESHOLD) {
      window.dispatchEvent(new CustomEvent('fabletoria:storage-warning', { detail: { usage, quota } }))
    }
  } catch {
    // Non-critical: storage estimate not available in all environments
  }
}
