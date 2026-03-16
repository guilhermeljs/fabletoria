import React from 'react'
import type { Component } from '../../lib/types'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'

interface ComponentListItemProps {
  component: Component
  isExpanded: boolean
  isEditing: boolean
  editValue: string
  onEditValueChange: (value: string) => void
  onToggleExpand: () => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onContextMenu: (event: React.MouseEvent) => void
  onAddVariation: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

export const ComponentListItem: React.FC<ComponentListItemProps> = ({
  component,
  isExpanded,
  isEditing,
  editValue,
  onEditValueChange,
  onToggleExpand,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onContextMenu,
  onAddVariation,
  inputRef
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onCommitEdit()
    if (e.key === 'Escape') onCancelEdit()
  }

  return (
    <div
      className="group flex items-center gap-tk-1.5 px-tk-3 py-tk-1.5 cursor-pointer hover:bg-bg-header rounded-tk-sm"
      onClick={onToggleExpand}
      onDoubleClick={onStartEdit}
      onContextMenu={onContextMenu}
    >
      <BaseIcon
        name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
        size={16}
        className="text-text-dim transition-transform mr-tk-1"
      />
      {isEditing ? (
        <BaseInput
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          size="sm"
          className="flex-1"
        />
      ) : (
        <BaseText size="sm" variant="dim" className="flex-1 truncate">
          {component.name}
        </BaseText>
      )}
      <BaseButton
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onAddVariation()
        }}
        className="opacity-0 group-hover:opacity-100 p-tk-1 min-w-0 h-auto"
        title="Add variation"
      >
        <BaseIcon name="Plus" size={12} />
      </BaseButton>
    </div>
  )
}
