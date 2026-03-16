import React from 'react'
import type { Variation } from '../../lib/types'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'
import { BaseText } from '../primitives/BaseText'

const VARIATION_DRAG_TYPE = 'application/fabletoria-variation'

interface VariationListItemProps {
  variation: Variation
  isSelected: boolean
  isEditing: boolean
  editValue: string
  editError: string
  onEditValueChange: (value: string) => void
  onSelect: () => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onContextMenu: (event: React.MouseEvent) => void
  inputRef: React.RefObject<HTMLInputElement>
}

export const VariationListItem: React.FC<VariationListItemProps> = ({
  variation,
  isSelected,
  isEditing,
  editValue,
  editError,
  onEditValueChange,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onContextMenu,
  inputRef
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onCommitEdit()
    if (e.key === 'Escape') onCancelEdit()
  }

  const itemClasses = `
    flex items-center gap-tk-2 pl-tk-8 pr-tk-3 py-tk-1 cursor-pointer 
    hover:bg-bg-header transition-colors
    ${isSelected ? 'bg-bg-header border-l-2 border-brand-primary pl-[30px]' : 'border-l-2 border-transparent'}
  `

  return (
    <li
      className={itemClasses}
      draggable
      onClick={onSelect}
      onDoubleClick={onStartEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData(VARIATION_DRAG_TYPE, variation.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onContextMenu={onContextMenu}
    >
      <BaseIcon name="Diamond" size={10} className="text-text-dim" />
      {isEditing ? (
        <div className="flex-1">
          <BaseInput
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            size="sm"
            error={editError || undefined}
            fullWidth
          />
        </div>
      ) : (
        <BaseText size="xs" variant="dim" className="flex-1 truncate">
          {variation.name}
        </BaseText>
      )}
    </li>
  )
}
