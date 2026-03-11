import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { db } from '../lib/db'
import type { Asset, AssetMap } from '../lib/types'
import { useProjectStore } from './project-store'

const ACCEPTED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'txt', 'md'
])

const EXTENSION_TO_TYPE: Record<string, Asset['type']> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
  pdf: 'document',
  txt: 'text', md: 'text'
}

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
  txt: 'text/plain', md: 'text/markdown'
}

function deriveExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function uniqueName(name: string, folder: string, assets: AssetMap): string {
  const existing = Object.values(assets)
    .filter((a) => a.folder === folder)
    .map((a) => a.name)
  if (!existing.includes(name)) return name
  let counter = 2
  const base = name.replace(/\.[^.]+$/, '')
  const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
  while (existing.includes(`${base}-${counter}${ext}`)) counter++
  return `${base}-${counter}${ext}`
}

interface AssetStore {
  assets: AssetMap

  createLocalAsset: (file: File, folder: string) => string | { error: string }
  createUrlAsset: (url: string, name: string, folder: string) => string
  renameAsset: (id: string, name: string) => void | { error: string }
  moveAsset: (id: string, folder: string) => void
  deleteAsset: (id: string) => void
  deleteFolder: (path: string) => void

  getAssetsByFolder: (folder: string) => Asset[]
  getAssetsByFolderRecursive: (prefix: string) => Asset[]
  searchAssets: (query: string) => Asset[]
  getFolders: () => string[]

  _updateProgress: (id: string, progress: number) => void
  _finalizeUpload: (id: string, data: Blob) => void
}

export const useAssetStore = create<AssetStore>()((set, get) => ({
  assets: {},

  createLocalAsset(file, folder) {
    const ext = deriveExtension(file)
    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      return { error: `File type ".${ext}" is not supported.` }
    }
    if (file.size > 50 * 1024 * 1024) {
      return { error: 'File exceeds the 50 MB limit.' }
    }

    const id = nanoid()
    const name = uniqueName(file.name, folder, get().assets)
    const asset: Asset = {
      id,
      name,
      type: EXTENSION_TO_TYPE[ext] ?? 'document',
      extension: ext,
      mimeType: EXTENSION_TO_MIME[ext] ?? file.type,
      sourceType: 'local',
      data: null,
      url: null,
      folder,
      size: file.size,
      status: 'uploading',
      uploadProgress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    set((s) => ({ assets: { ...s.assets, [id]: asset } }))

    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        get()._updateProgress(id, Math.round((e.loaded / e.total) * 100))
      }
    }
    reader.onload = (e) => {
      const blob = new Blob([e.target!.result as ArrayBuffer], { type: file.type })
      get()._finalizeUpload(id, blob)
    }
    reader.readAsArrayBuffer(file)

    return id
  },

  createUrlAsset(url, name, folder) {
    const id = nanoid()
    const safeName = uniqueName(name, folder, get().assets)
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    const asset: Asset = {
      id,
      name: safeName,
      type: EXTENSION_TO_TYPE[ext] ?? 'image',
      extension: ext,
      mimeType: EXTENSION_TO_MIME[ext] ?? 'image/*',
      sourceType: 'url',
      data: null,
      url,
      folder,
      size: 0,
      status: 'ready',
      uploadProgress: 100,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    set((s) => ({ assets: { ...s.assets, [id]: asset } }))
    db.assets.put(asset)
    return id
  },

  renameAsset(id, name) {
    const asset = get().assets[id]
    if (!asset) return { error: 'Asset not found.' }
    const sibling = Object.values(get().assets).find(
      (a) => a.folder === asset.folder && a.name === name && a.id !== id
    )
    if (sibling) return { error: `An asset named "${name}" already exists in this folder.` }
    const updated = { ...asset, name, updatedAt: Date.now() }
    set((s) => ({ assets: { ...s.assets, [id]: updated } }))
    db.assets.put(updated)
    return undefined
  },

  moveAsset(id, folder) {
    const asset = get().assets[id]
    if (!asset) return
    const name = uniqueName(asset.name, folder, get().assets)
    const updated = { ...asset, name, folder, updatedAt: Date.now() }
    set((s) => ({ assets: { ...s.assets, [id]: updated } }))
    db.assets.put(updated)
  },

  deleteAsset(id) {
    const projectState = useProjectStore.getState()
    const nodes = Object.values(projectState.nodes)
    for (const node of nodes) {
      if (!node.content) continue
      try {
        const parsed = JSON.parse(node.content) as Record<string, unknown>
        const cleaned = removeAssetReferences(parsed, id)
        if (cleaned !== parsed) {
          projectState.updateNodeContent(node.id, JSON.stringify(cleaned))
        }
      } catch {
        // non-JSON content, skip
      }
    }
    set((s) => {
      const next = { ...s.assets }
      delete next[id]
      return { assets: next }
    })
    db.assets.delete(id)
  },

  deleteFolder(path) {
    const toDelete = get().getAssetsByFolderRecursive(path)
    for (const asset of toDelete) {
      get().deleteAsset(asset.id)
    }
  },

  getAssetsByFolder(folder) {
    return Object.values(get().assets).filter((a) => a.folder === folder)
  },

  getAssetsByFolderRecursive(prefix) {
    return Object.values(get().assets).filter(
      (a) => a.folder === prefix || a.folder.startsWith(prefix + '/')
    )
  },

  searchAssets(query) {
    const q = query.toLowerCase()
    return Object.values(get().assets).filter((a) => a.name.toLowerCase().includes(q))
  },

  getFolders() {
    const paths = new Set(Object.values(get().assets).map((a) => a.folder))
    return Array.from(paths).sort()
  },

  _updateProgress(id, progress) {
    set((s) => {
      const asset = s.assets[id]
      if (!asset) return s
      return { assets: { ...s.assets, [id]: { ...asset, uploadProgress: progress } } }
    })
  },

  _finalizeUpload(id, data) {
    set((s) => {
      const asset = s.assets[id]
      if (!asset) return s
      const updated: Asset = { ...asset, data, status: 'ready', uploadProgress: 100, updatedAt: Date.now() }
      db.assets.put(updated)
      return { assets: { ...s.assets, [id]: updated } }
    })
  }
}))

function removeAssetReferences(node: Record<string, unknown>, assetId: string): Record<string, unknown> {
  if (node.type === 'assetImage' || node.type === 'assetFile') {
    const attrs = node.attrs as Record<string, unknown> | undefined
    if (attrs?.assetId === assetId) {
      return null as unknown as Record<string, unknown>
    }
  }
  if (Array.isArray(node.content)) {
    const filtered = node.content
      .map((child: Record<string, unknown>) => removeAssetReferences(child, assetId))
      .filter(Boolean)
    if (filtered.length !== node.content.length) {
      return { ...node, content: filtered }
    }
  }
  return node
}
