import { useState, useRef, useEffect, useMemo } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import { useRealtimeStore } from '../../stores/realtime-store'
import type { EntityId, Narrative } from '../../lib/types';
import { NarrativeListItem } from './NarrativeListItem';
import { useModalStore } from '../../stores/modal-store';
import { BaseText } from '../primitives/BaseText';
import { BaseButton } from '../primitives/BaseButton';
import { BaseIcon } from '../primitives/BaseIcon';
 
export default function NarrativeList() {
  const narratives = useProjectStore((s) => s.narratives)
  const createNarrative = useProjectStore((s) => s.createNarrative)
  const renameNarrative = useProjectStore((s) => s.renameNarrative)
  const deleteNarrative = useProjectStore((s) => s.deleteNarrative)
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const setActiveNarrative = useUIStore((s) => s.setActiveNarrative)
  const modalStore = useModalStore()

  const realtimeMode = useRealtimeStore((s) => s.mode)
  const clientCursors = useRealtimeStore((s) => s.clientCursors)

  // Map narrativeId → list of client invite indices currently on that narrative
  const clientsPerNarrative = useMemo<Record<string, number[]>>(() => {
    if (realtimeMode !== 'host') return {}
    const result: Record<string, number[]> = {}
    for (const [idxStr, cursor] of Object.entries(clientCursors)) {
      if (!cursor) continue
      const list = result[cursor.narrativeId] ?? []
      list.push(parseInt(idxStr))
      result[cursor.narrativeId] = list
    }
    return result
  }, [realtimeMode, clientCursors])

  const [editingId, setEditingId] = useState<EntityId | null>(null)
  const [editValue, setEditValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ id: EntityId; x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = Object.values(narratives)
    .filter(Boolean)
    .sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0)) as Narrative[]

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function startEdit(narrative: Narrative) {
    setEditingId(narrative.id)
    setEditValue(narrative.name)
  }

  function commitEdit(id: EntityId) {
    if (editValue.trim() && editValue !== narratives[id]?.name) {
      renameNarrative(id, editValue.trim())
    }
    setEditingId(null)
  }

  function handleDelete(id: EntityId) {
    modalStore.openModal('Confirm', {
      title: 'Delete Narrative',
      message: 'Are you sure you want to delete this narrative and all its nodes and connections? This action cannot be undone.',
      confirmLabel: 'Delete Narrative',
      onConfirm: () => {
        deleteNarrative(id)
      }
    })
    setContextMenu(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-tk-3 py-tk-2">
        <BaseText size="xs" variant="dim" weight="semibold" className="uppercase tracking-wider">
          Narratives
        </BaseText>
        <BaseButton
          variant="ghost"
          size="sm"
          onClick={() => {
            const n = createNarrative('New Narrative')
            setActiveNarrative(n.id)
            startEdit(n)
          }}
          title="New narrative"
        >
          <BaseIcon name="Plus" size={16} />
        </BaseButton>
      </div>

      <ul className="flex flex-col">
        {sorted.map((narrative) => (
          <NarrativeListItem
            key={narrative.id}
            narrative={narrative}
            isActive={activeNarrativeId === narrative.id}
            isEditing={editingId === narrative.id}
            clientIndices={clientsPerNarrative[narrative.id] ?? []}
            editValue={editValue}
            onEditValueChange={setEditValue}
            onSelect={() => {
              if (editingId !== narrative.id) setActiveNarrative(narrative.id)
            }}
            onStartEdit={() => startEdit(narrative)}
            onCommitEdit={() => commitEdit(narrative.id)}
            onCancelEdit={() => setEditingId(null)}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault()
              setContextMenu({ id: narrative.id, x: e.clientX, y: e.clientY })
            }}
            inputRef={inputRef as React.RefObject<HTMLInputElement>}
          />
        ))}
        {sorted.length === 0 && (
          <li className="px-tk-3 py-tk-2">
            <BaseText size="sm" variant="dim" italic>
              No narratives yet
            </BaseText>
          </li>
        )}
      </ul>

      {contextMenu && (
        <div
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
          className="bg-bg-surface border border-border-main rounded-tk-md py-tk-1 shadow-xl min-w-[128px]"
          onClick={(e) => e.stopPropagation()}
        >
          <BaseButton
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              const n = narratives[contextMenu.id]
              if (n) startEdit(n)
              setContextMenu(null)
            }}
          >
            Rename
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            className="w-full justify-start text-status-error hover:text-status-error"
            onClick={() => handleDelete(contextMenu.id)}
          >
            Delete
          </BaseButton>
        </div>
      )}
    </div>
  )
}
