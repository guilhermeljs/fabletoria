import { useEffect, useState } from 'react'
import type { Asset } from '../../lib/types'

interface Props {
  asset: Asset
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  mode: 'browse' | 'select'
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  txt: '📝',
  md: '📝',
}

export default function AssetGridItem({ asset, isSelected, onClick, mode }: Props) {
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

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-lg overflow-hidden cursor-pointer border transition-colors ${
        isSelected
          ? 'border-violet-500 bg-violet-950/30'
          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'
      }`}
      style={{ height: '120px' }}
    >
      {/* Thumbnail area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">
        {asset.type === 'image' && imgSrc ? (
          <img
            src={imgSrc}
            alt={asset.name}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-3xl">
            {FILE_ICONS[asset.extension] ?? '📎'}
          </span>
        )}

        {/* Upload progress overlay */}
        {asset.status === 'uploading' && (
          <div className="absolute inset-0 bg-zinc-900/80 flex flex-col items-center justify-center gap-1">
            <div className="w-3/4 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: `${asset.uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{asset.uploadProgress}%</span>
          </div>
        )}

        {/* Selection checkbox */}
        {mode === 'browse' && (
          <div
            className={`absolute top-1.5 left-1.5 w-4 h-4 rounded border transition-all ${
              isSelected
                ? 'bg-violet-500 border-violet-500 flex items-center justify-center'
                : 'border-zinc-600 bg-zinc-800/70 opacity-0 group-hover:opacity-100'
            }`}
          >
            {isSelected && <span className="text-white text-xs leading-none">✓</span>}
          </div>
        )}
      </div>

      {/* Filename */}
      <div className="px-1.5 py-1 shrink-0">
        <p className="text-xs text-zinc-400 truncate" title={asset.name}>
          {asset.name}
        </p>
      </div>
    </div>
  )
}
