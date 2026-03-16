import { useEffect, useState } from 'react'
import type { Asset } from '../../lib/types'
import { BaseIcon, IconName } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

interface Props {
  asset: Asset
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  mode: 'browse' | 'select'
}

const FILE_ICONS: Record<string, IconName> = {
  pdf: 'FileText',
  txt: 'FileText',
  md: 'FileText'
}

export default function AssetGridItem({ asset, isSelected, onClick, mode }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (asset.type === 'image' && asset.sourceType === 'local' && asset.data) {
      const url = URL.createObjectURL(asset.data)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [asset.type, asset.sourceType, asset.data])

  const imgSrc = asset.sourceType === 'url' ? asset.url : objectUrl
  const FileIcon = FILE_ICONS[asset.extension] ?? 'File'

  const selectionClass = isSelected
    ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary'
    : 'border-border-main hover:border-border-light bg-bg-surface'

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-tk-lg overflow-hidden cursor-pointer border transition-all duration-150 ${selectionClass}`}
      style={{ height: '120px' }}
    >
      {/* Thumbnail area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-bg-main p-tk-2">
        {asset.type === 'image' && imgSrc ? (
          <img
            src={imgSrc}
            alt={asset.name}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <BaseIcon name={FileIcon} size={32} className="text-text-dim" />
        )}

        {/* Upload progress overlay */}
        {asset.status === 'uploading' && (
          <div className="absolute inset-0 bg-bg-surface/80 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
            <div className="w-3/4 h-1.5 bg-border-main rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-200"
                style={{ width: `${asset.uploadProgress}%` }}
              />
            </div>
            <BaseText size="xs" variant="dim">
              {asset.uploadProgress}%
            </BaseText>
          </div>
        )}

        {/* Selection checkbox */}
        {mode === 'browse' && (
          <div
            className={`absolute top-2 left-2 w-4 h-4 rounded-tk-sm border-2 transition-all duration-150 flex items-center justify-center ${
              isSelected
                ? 'bg-brand-primary border-brand-primary'
                : 'border-border-light bg-bg-surface opacity-0 group-hover:opacity-100'
            }`}
          >
            {isSelected && <BaseIcon name="Check" size={12} className="text-white" />}
          </div>
        )}
      </div>

      {/* Filename */}
      <div className="px-tk-2 py-tk-1.5 shrink-0 border-t border-border-main">
        <BaseText size="xs" variant="dim" className="truncate">
          {asset.name}
        </BaseText>
      </div>
    </div>
  )
}
