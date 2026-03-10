import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import type { EntityId, Narrative } from '../../lib/types'

export default function NarrativeList() {
  const narratives = useProjectStore((s) => s.narratives)
  const createNarrative = useProjectStore((s) => s.createNarrative)
  const renameNarrative = useProjectStore((s) => s.renameNarrative)
  const deleteNarrative = useProjectStore((s) => s.deleteNarrative)
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const setActiveNarrative = useUIStore((s) => s.setActiveNarrative)

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
    if (editValue.trim()) {
      renameNarrative(id, editValue.trim())
    }
    setEditingId(null)
  }

  function handleDelete(id: EntityId) {
    if (window.confirm('Delete this narrative and all its nodes and connections?')) {
      deleteNarrative(id)
    }
    setContextMenu(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Narratives</span>
        <button
          onClick={() => {
            const n = createNarrative('New Narrative')
            setActiveNarrative(n.id)
            startEdit(n)
          }}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          title="New narrative"
        >
          +
        </button>
      </div>

      <ul className="flex flex-col">
        {sorted.map((narrative) => (
          <li
            key={narrative.id}
            className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-zinc-800 transition-colors ${
              activeNarrativeId === narrative.id ? 'bg-zinc-800 border-l-2 border-violet-500' : ''
            }`}
            onClick={() => {
              if (editingId !== narrative.id) setActiveNarrative(narrative.id)
            }}
            onDoubleClick={() => startEdit(narrative)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ id: narrative.id, x: e.clientX, y: e.clientY })
            }}
          >
            {editingId === narrative.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(narrative.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(narrative.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 bg-zinc-700 border border-violet-500 rounded px-1.5 py-0.5 text-sm text-zinc-100 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm text-zinc-300 truncate">{narrative.name}</span>
            )}
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="px-3 py-3 text-xs text-zinc-600 italic">No narratives yet</li>
        )}
      </ul>

      {contextMenu && (
        <div
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
          className="bg-zinc-900 border border-zinc-700 rounded py-1 shadow-xl min-w-32"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              const n = narratives[contextMenu.id]
              if (n) startEdit(n)
              setContextMenu(null)
            }}
          >
            Rename
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-800"
            onClick={() => handleDelete(contextMenu.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
