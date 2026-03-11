import { useEffect, useRef, useState, useCallback } from 'react'
import { useAssetStore } from '../../stores/asset-store'
import { useUIStore } from '../../stores/ui-store'
import type { Asset } from '../../lib/types'
import AssetGrid from './AssetGrid'
import AssetSearchBar from './AssetSearchBar'
import AssetUploadBar from './AssetUploadBar'
import AssetBreadcrumb from './AssetBreadcrumb'
import AssetDetailPanel from './AssetDetailPanel'
import ConfirmModal from './ConfirmModal'
import { useAssetDrop } from '../../hooks/useAssetDrop'

interface Props {
  mode: 'browse' | 'select'
  onClose: () => void
  onSelect?: (asset: Asset) => void
}

export default function AssetManagerModal({ mode, onClose, onSelect }: Props) {
  const assets = useAssetStore((s) => s.assets)
  const deleteAsset = useAssetStore((s) => s.deleteAsset)
  const createLocalAsset = useAssetStore((s) => s.createLocalAsset)
  const createUrlAsset = useAssetStore((s) => s.createUrlAsset)
  const activeFolder = useUIStore((s) => s.activeFolder)
  const setActiveFolder = useUIStore((s) => s.setActiveFolder)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [folderDeleteStep, setFolderDeleteStep] = useState<{ folder: string; step: 1 | 2 } | null>(null)

  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const allAssets = Object.values(assets)

  // Compute visible assets
  const visibleAssets = searchQuery
    ? allAssets.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allAssets.filter((a) => a.folder === activeFolder)

  // Compute folders at current level
  const allFolderPaths = Array.from(new Set(allAssets.map((a) => a.folder))).sort()
  const folders = activeFolder === '/'
    ? allFolderPaths.filter((f) => f !== '/' && !f.slice(1).includes('/'))
    : (() => {
        const prefix = activeFolder + '/'
        return allFolderPaths.filter((f) => f.startsWith(prefix) && !f.slice(prefix.length).includes('/'))
      })()

  const handleItemClick = useCallback((id: string, e: React.MouseEvent) => {
    if (mode === 'select') {
      setDetailAsset(assets[id] ?? null)
      return
    }

    const assetList = visibleAssets.map((a) => a.id)

    if (e.shiftKey && lastClickedId) {
      const lastIdx = assetList.indexOf(lastClickedId)
      const thisIdx = assetList.indexOf(id)
      if (lastIdx !== -1 && thisIdx !== -1) {
        const [from, to] = lastIdx < thisIdx ? [lastIdx, thisIdx] : [thisIdx, lastIdx]
        const rangeIds = assetList.slice(from, to + 1)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          rangeIds.forEach((rid) => next.add(rid))
          return next
        })
        return
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      setLastClickedId(id)
      return
    }

    setSelectedIds(new Set([id]))
    setLastClickedId(id)
  }, [mode, assets, visibleAssets, lastClickedId])

  const handleFolderClick = (path: string) => {
    setActiveFolder(path)
    setSelectedIds(new Set())
    setSearchQuery('')
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    setConfirmDelete(true)
  }

  const confirmDeleteAssets = () => {
    selectedIds.forEach((id) => deleteAsset(id))
    setSelectedIds(new Set())
    setConfirmDelete(false)
  }

  const handleDeleteFolder = (folder: string) => {
    setFolderDeleteStep({ folder, step: 1 })
  }

  const handleFileSelect = (files: File[]) => {
    files.forEach((file) => createLocalAsset(file, activeFolder))
  }

  const handleUrlSubmit = (url: string, name: string) => {
    createUrlAsset(url, name, activeFolder)
  }

  const handleFolderCreate = (name: string) => {
    const newPath = activeFolder === '/' ? `/${name}` : `${activeFolder}/${name}`
    setActiveFolder(newPath)
  }

  const { isDragging, dropProps } = useAssetDrop((files) => {
    files.forEach((file) => createLocalAsset(file, activeFolder))
  })

  const handleSelectAsset = (asset: Asset) => {
    if (onSelect) {
      onSelect(asset)
      onClose()
    }
  }

  const folderAssetCount = folderDeleteStep
    ? allAssets.filter((a) => a.folder === folderDeleteStep.folder || a.folder.startsWith(folderDeleteStep.folder + '/')).length
    : 0

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="relative flex flex-col bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl"
        style={{ minHeight: '560px', maxHeight: '80vh' }}
        {...dropProps}
      >
        {/* Drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-violet-950/80 border-2 border-violet-500 border-dashed pointer-events-none">
            <span className="text-violet-300 text-lg font-semibold">Drop to create asset</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700 shrink-0">
          <span className="text-sm font-semibold text-zinc-200">Assets</span>
          <div className="flex-1 mx-4">
            <AssetSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Breadcrumb */}
        {!searchQuery && (
          <div className="px-5 py-2 border-b border-zinc-800 shrink-0">
            <AssetBreadcrumb path={activeFolder} onNavigate={handleFolderClick} />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AssetGrid
              assets={visibleAssets}
              folders={folders}
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onFolderClick={handleFolderClick}
              onFolderDelete={handleDeleteFolder}
              isDragging={isDragging}
              mode={mode}
            />
          </div>

          {/* Detail panel (select mode only) */}
          {mode === 'select' && detailAsset && (
            <AssetDetailPanel
              asset={detailAsset}
              onSelect={() => handleSelectAsset(detailAsset)}
              onClose={() => setDetailAsset(null)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 shrink-0">
          <AssetUploadBar
            currentFolder={activeFolder}
            onFileSelect={handleFileSelect}
            onUrlSubmit={handleUrlSubmit}
            onFolderCreate={handleFolderCreate}
          />
          {selectedIds.size > 0 && mode === 'browse' && (
            <button
              onClick={handleDeleteSelected}
              className="ml-4 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-800 rounded-lg hover:bg-red-950 transition-colors shrink-0"
            >
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Single/bulk delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete assets?"
          body={`Deleting ${selectedIds.size} asset(s) will also remove all references to them from your narrative content. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteAssets}
          onCancel={() => setConfirmDelete(false)}
          danger
        />
      )}

      {/* Folder delete — step 1 */}
      {folderDeleteStep?.step === 1 && (
        <ConfirmModal
          title={`Delete folder '${folderDeleteStep.folder.split('/').pop()}'?`}
          body={`This folder contains ${folderAssetCount} asset(s). Deleting it will permanently remove all assets and their references from your narrative content.`}
          confirmLabel="Continue"
          onConfirm={() => setFolderDeleteStep({ ...folderDeleteStep, step: 2 })}
          onCancel={() => setFolderDeleteStep(null)}
          danger
        />
      )}

      {/* Folder delete — step 2 */}
      {folderDeleteStep?.step === 2 && (
        <ConfirmModal
          title="Are you absolutely sure?"
          body="This action is destructive and cannot be undone."
          confirmLabel="Delete forever"
          onConfirm={() => {
            useAssetStore.getState().deleteFolder(folderDeleteStep.folder)
            setFolderDeleteStep(null)
            if (activeFolder.startsWith(folderDeleteStep.folder)) {
              setActiveFolder('/')
            }
          }}
          onCancel={() => setFolderDeleteStep(null)}
          danger
        />
      )}
    </div>
  )
}
