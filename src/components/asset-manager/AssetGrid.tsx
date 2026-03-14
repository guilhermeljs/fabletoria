import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Asset } from '../../lib/types'
import AssetGridItem from './AssetGridItem'
import AssetFolderItem from './AssetFolderItem'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

interface Props {
  assets: Asset[]
  folders: string[]
  selectedIds: Set<string>
  onItemClick: (id: string, e: React.MouseEvent) => void
  onFolderClick: (path: string) => void
  onFolderDelete: (path: string) => void
  isDragging: boolean
  mode: 'browse' | 'select'
}

const COLUMNS = 4
const ITEM_HEIGHT = 148

export default function AssetGrid({
  assets,
  folders,
  selectedIds,
  onItemClick,
  onFolderClick,
  onFolderDelete,
  mode
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const folderItems = folders.map((f) => ({ kind: 'folder' as const, path: f }))
    const assetItems = assets.map((a) => ({ kind: 'asset' as const, asset: a }))
    return [...folderItems, ...assetItems]
  }, [folders, assets])

  const rows = useMemo(() => {
    const result: typeof items[number][][] = []
    for (let i = 0; i < items.length; i += COLUMNS) {
      result.push(items.slice(i, i + COLUMNS))
    }
    return result
  }, [items])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3
  })

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-8">
        <BaseText size="sm" variant="dim">
          <BaseIcon name="Inbox" />
        </BaseText>
        <BaseText size="sm" variant="dim">
          No assets here yet
        </BaseText>
        <BaseText size="sm" variant="dim">
          Upload a file or add a URL below
        </BaseText>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto p-4">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]!
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ITEM_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                gap: '12px',
                alignItems: 'start'
              }}
            >
              {row.map((item, colIdx) => {
                if (item.kind === 'folder') {
                  return (
                    <AssetFolderItem
                      key={`folder-${item.path}-${colIdx}`}
                      path={item.path}
                      onClick={() => onFolderClick(item.path)}
                      onDelete={() => onFolderDelete(item.path)}
                    />
                  )
                }
                return (
                  <AssetGridItem
                    key={item.asset.id}
                    asset={item.asset}
                    isSelected={selectedIds.has(item.asset.id)}
                    onClick={(e) => onItemClick(item.asset.id, e)}
                    mode={mode}
                  />
                )
              })}
              {row.length < COLUMNS &&
                Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
