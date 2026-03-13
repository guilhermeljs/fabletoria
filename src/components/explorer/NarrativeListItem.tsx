import React from 'react';
import type { Narrative } from '../../lib/types';
import { BaseText } from '../primitives/BaseText';
import { BaseInput } from '../primitives/BaseInput';

interface NarrativeListItemProps {
  narrative: Narrative;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const NarrativeListItem: React.FC<NarrativeListItemProps> = ({
  narrative,
  isActive,
  isEditing,
  editValue,
  onEditValueChange,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onContextMenu,
  inputRef,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommitEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const itemClasses = `
    group flex items-center gap-tk-3 px-tk-3 py-tk-1.5 cursor-pointer 
    hover:bg-bg-header transition-colors rounded-tk-sm
    py-tk-2
    ${isActive ? 'bg-bg-header border-l-2 border-brand-primary pl-tk-2.5' : 'border-l-2 border-transparent'}
  `;

  return (
    <li className={itemClasses} onClick={onSelect} onDoubleClick={onStartEdit} onContextMenu={onContextMenu}>
        {isEditing ? (
            <BaseInput ref={inputRef} value={editValue} onChange={(e) => onEditValueChange(e.target.value)} onBlur={onCommitEdit} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()} size="sm" />
        ) : (
            <BaseText size="sm" className="truncate flex-1">{narrative.name}</BaseText>
        )}
    </li>
  );
};