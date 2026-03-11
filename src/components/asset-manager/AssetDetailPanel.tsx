import { useEffect, useState } from 'react'
import type { Asset } from '../../lib/types'

interface Props {
  asset: Asset
  onSelect: () => void
  onClose: () => void
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  txt: '📝',
  md: '📝',
}

export default function AssetDetailPanel({ asset, onSelect, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (asset.type === 'image' && asset.sourceType === 'local' && asset.data) {
      const url = URL.createObjectURL(asset.data)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [asset.type, asset.sourceType, asset.data])

  const imgSrc = asset.sourceType === 'url' ? asset.url : objectUrl

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-52 shrink-0 border-l border-zinc-800 flex flex-col bg-zinc-900/50">
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/80">
        {asset.type === 'image' && imgSrc ? (
          <img
            src={imgSrc}
            alt={asset.name}
            className="max-w-full max-h-full object-contain rounded"
            draggable={false}
          />
        ) : (
          <span className="text-5xl">{FILE_ICONS[asset.extension] ?? '📎'}</span>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3 border-t border-zinc-800 space-y-1">
        <p className="text-xs font-medium text-zinc-200 truncate" title={asset.name}>{asset.name}</p>
        <p className="text-xs text-zinc-500">{asset.extension.toUpperCase()} · {formatSize(asset.size)}</p>
        <p className="text-xs text-zinc-600">{new Date(asset.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-zinc-800 flex flex-col gap-2">
        <button
          onClick={onSelect}
          className="w-full py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
        >
          Select
        </button>
        <button
          onClick={onClose}
          className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Close panel
        </button>
      </div>
    </div>
  )
}
