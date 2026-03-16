import { useEffect, useState } from 'react'
import type { Asset } from '../../lib/types'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon, IconName } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

interface Props {
  asset: Asset
  onSelect: () => void
  onClose: () => void
}

const FILE_ICONS: Record<string, IconName> = {
  pdf: 'FileText',
  txt: 'FileText',
  md: 'FileText'
}

export default function AssetDetailPanel({ asset, onSelect, onClose }: Props) {
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const FileIcon = FILE_ICONS[asset.extension] ?? 'File'

  return (
    <aside className="w-60 shrink-0 border-l border-border-main flex flex-col bg-bg-header">
      <header className="p-tk-4 flex items-center justify-between border-b border-border-main">
        <BaseText size="sm" weight="semibold">
          Details
        </BaseText>
        <BaseButton variant="ghost" size="sm" onClick={onClose} className="p-tk-1 min-w-0 h-auto">
          <BaseIcon name="X" size={16} />
        </BaseButton>
      </header>

      {/* Preview */}
      <div className="flex-1 flex flex-col p-tk-4 gap-tk-4">
        <div className="flex-1 flex items-center justify-center p-tk-4 bg-bg-main rounded-tk-md border border-border-main min-h-[120px]">
          {asset.type === 'image' && imgSrc ? (
            <img
              src={imgSrc}
              alt={asset.name}
              className="max-w-full max-h-full object-contain rounded-tk-sm"
              draggable={false}
            />
          ) : (
            <BaseIcon name={FileIcon} size={48} className="text-text-dim" />
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-tk-2">
          <BaseText size="sm" weight="medium" className="truncate">
            {asset.name}
          </BaseText>
          <div className="space-y-tk-1">
            <BaseText size="xs" variant="dim">
              {asset.extension.toUpperCase()} · {formatSize(asset.size)}
            </BaseText>
            <BaseText size="xs" variant="dim">
              Created: {new Date(asset.createdAt).toLocaleDateString()}
            </BaseText>
          </div>
        </div>
      </div>

      {/* Actions */}
      <footer className="p-tk-4 border-t border-border-main flex flex-col gap-tk-2">
        <BaseButton variant="primary" size="md" onClick={onSelect}>
          Select
        </BaseButton>
      </footer>
    </aside>
  )
}
