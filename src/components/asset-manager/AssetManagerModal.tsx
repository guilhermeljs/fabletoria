import { useState, useCallback } from 'react'
import { useAssetStore } from '../../stores/asset-store'
import type { Asset } from '../../lib/types'
import AssetGrid from './AssetGrid'
import AssetSearchBar from './AssetSearchBar'
import AssetUploadBar from './AssetUploadBar'
import AssetBreadcrumb from './AssetBreadcrumb'
import AssetDetailPanel from './AssetDetailPanel'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { useModalStore } from '../../stores/modal-store'
import { useAssetDrop } from '../../hooks/useAssetDrop'

interface Props {
  mode: 'browse' | 'select'
  onClose: () => void
  onSelect?: (asset: Asset) => void
}

export default function AssetManagerModal({ mode = 'browse', onClose, onSelect }: Props) {
  const assets = useAssetStore((s) => s.assets)
  const deleteAsset = useAssetStore((s) => s.deleteAsset)
  const createLocalAsset = useAssetStore((s) => s.createLocalAsset)
  const createUrlAsset = useAssetStore((s) => s.createUrlAsset)
  const modalStore = useModalStore()
  const [activeFolder, setActiveFolder] = useState('/')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)

  const allAssets = Object.values(assets)

  const visibleAssets = searchQuery
    ? allAssets.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allAssets.filter((a) => a.folder === activeFolder)

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
    modalStore.openModal('Confirm', {
      title: `Delete ${selectedIds.size} Asset(s)`,
      message: `Are you sure you want to delete ${selectedIds.size} selected asset(s)? This action cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        selectedIds.forEach((id) => deleteAsset(id))
        setSelectedIds(new Set())
      }
    })
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

  return (
    <div
      className="relative flex flex-col bg-bg-header border border-border-main rounded-tk-xl shadow-2xl w-full max-w-5xl pointer-events-auto"
      style={{ minHeight: '560px', maxHeight: '80vh' }}
      {...dropProps}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-tk-xl bg-brand-primary/20 border-2 border-brand-primary border-dashed pointer-events-none">
          <BaseText size="lg" weight="semibold" variant="primary">Drop to create asset</BaseText>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-tk-5 py-tk-3 border-b border-border-main shrink-0">
        <BaseText size="sm" weight="semibold" className='ml-tk-4'>
          Asset Manager
        </BaseText>
        <div className="flex-1 mx-tk-4">
          <AssetSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <BaseButton variant="ghost" size="sm" onClick={onClose} className="min-w-0 p-tk-1">
          <BaseIcon name="X" size={18} />
        </BaseButton>
      </div>

      {/* Breadcrumb */}
      {!searchQuery && (
        <div className="px-tk-5 py-tk-2 border-b border-border-main shrink-0">
          <AssetBreadcrumb path={activeFolder} onNavigate={handleFolderClick} />
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 bg-bg-surface overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <AssetGrid
            assets={visibleAssets}
            folders={folders}
            selectedIds={selectedIds}
            onItemClick={handleItemClick}
            onFolderClick={handleFolderClick}
            onFolderDelete={(folder) => {
                modalStore.openModal('Confirm', {
                  title: `Delete Folder`,
                  message: `Are you sure you want to delete the folder "${folder}" and all its contents? This action cannot be undone.`,
                  confirmLabel: 'Delete Folder',
                  onConfirm: () => {
                    useAssetStore.getState().deleteFolder(folder)
                  }
                })
            }}
            isDragging={isDragging}
            mode={mode}
          />
        </div>

        {mode === 'select' && detailAsset && (
          <AssetDetailPanel
            asset={detailAsset}
            onSelect={() => handleSelectAsset(detailAsset)}
            onClose={() => setDetailAsset(null)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-tk-4 py-tk-2 border-t rounded-b-tk-xl border-border-main bg-bg-header shrink-0">
        <AssetUploadBar
          currentFolder={activeFolder}
          onFileSelect={(files) => files.forEach((file) => createLocalAsset(file, activeFolder))}
          onUrlSubmit={(url, name) => createUrlAsset(url, name, activeFolder)}
          onFolderCreate={(name) => {
            const newPath = activeFolder === '/' ? `/${name}` : `${activeFolder}/${name}`
            setActiveFolder(newPath)
          }}
        />
        {selectedIds.size > 0 && mode === 'browse' && (
          <BaseButton
            variant="danger"
            size="sm"
            onClick={handleDeleteSelected}
            leftIcon={<BaseIcon name="Trash2" size={14} />}
          >
            Delete ({selectedIds.size})
          </BaseButton>
        )}
      </div>
    </div>
  )
}
