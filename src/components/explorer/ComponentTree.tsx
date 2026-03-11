import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import type { EntityId, Component, FieldSchema, FieldType } from '../../lib/types'
import TiptapEditor from '../inspector/TiptapEditor'

const VARIATION_DRAG_TYPE = 'application/narrativeflow-variation'

export default function ComponentTree() {
  const components = useProjectStore((s) => s.components)
  const variations = useProjectStore((s) => s.variations)
  const createComponent = useProjectStore((s) => s.createComponent)
  const deleteComponent = useProjectStore((s) => s.deleteComponent)
  const renameComponent = useProjectStore((s) => s.renameComponent)
  const createVariation = useProjectStore((s) => s.createVariation)
  const renameVariation = useProjectStore((s) => s.renameVariation)
  const deleteVariation = useProjectStore((s) => s.deleteVariation)
  const updateComponentSchema = useProjectStore((s) => s.updateComponentSchema)
  const updateComponentDefaults = useProjectStore((s) => s.updateComponentDefaults)

  const selectedVariationId = useUIStore((s) => s.singleSelectedVariationId)
  const setSelectedVariation = useUIStore((s) => s.setSelectedVariation)
  const openInspector = useUIStore((s) => s.openInspector)

  const [expandedComponents, setExpandedComponents] = useState<Set<EntityId>>(new Set())
  const [editingId, setEditingId] = useState<{ type: 'component' | 'variation'; id: EntityId } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const [schemaModal, setSchemaModal] = useState<{ component?: Component } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    type: 'component' | 'variation'
    id: EntityId
    x: number
    y: number
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

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

  function toggleExpand(id: EntityId) {
    setExpandedComponents((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startEditComponent(component: Component) {
    setEditingId({ type: 'component', id: component.id })
    setEditValue(component.name)
    setEditError('')
  }

  function commitEdit() {
    if (!editingId) return
    if (!editValue.trim()) {
      setEditingId(null)
      return
    }

    if (editingId.type === 'variation') {
      const result = renameVariation(editingId.id, editValue.trim())
      if ('error' in result) {
        setEditError(result.error)
        return
      }
    } else {
      renameComponent(editingId.id, editValue.trim())
    }
    setEditingId(null)
    setEditError('')
  }

  function handleAddVariation(componentId: EntityId) {
    let name = 'New Variation'
    let counter = 1
    while (Object.values(variations).some((v) => v?.name === name)) {
      name = `New Variation ${counter++}`
    }
    const title = components[componentId]?.defaults["title"] ?? ""
    const content = components[componentId]?.defaults["content"] ?? ""

    const result = createVariation(componentId, name, {}, content, title)
    if ('variation' in result) {
      setExpandedComponents((prev) => new Set([...prev, componentId]))
      setSelectedVariation(result.variation.id)
      openInspector()
    }
  }

  const sortedComponents = Object.values(components).filter(Boolean).sort((a, b) => (a?.createdAt ?? 0) - (b?.createdAt ?? 0)) as Component[]

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Components</span>
        <button
          onClick={() => setSchemaModal({})}
          className="text-lg text-violet-400 hover:text-violet-300 transition-colors"
          title="New component"
        >
          +
        </button>
      </div>

      <ul className="flex flex-col">
        {sortedComponents.map((component) => {
          const componentVariations = Object.values(variations)
            .filter((v) => v?.componentId === component.id)
            .filter(Boolean) as typeof variations[string][]

          const isExpanded = expandedComponents.has(component.id)

          return (
            <li key={component.id}>
              {/* Component row */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-800 group"
                onClick={() => toggleExpand(component.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ type: 'component', id: component.id, x: e.clientX, y: e.clientY })
                }}
              >
                <span className="text-xs text-zinc-600">{isExpanded ? '▾' : '▸'}</span>
                {editingId?.type === 'component' && editingId.id === component.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 bg-zinc-700 border border-violet-500 rounded px-1 py-0.5 text-xs text-zinc-100 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm text-zinc-300">{component.name}</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddVariation(component.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-lg text-zinc-500 hover:text-violet-400 transition-all"
                  title="Add variation"
                >
                  +
                </button>
              </div>

              {/* Variations */}
              {isExpanded && (
                <ul>
                  {(componentVariations as NonNullable<typeof variations[string]>[]).map((variation) => (
                    <li
                      key={variation.id}
                      className={`flex items-center gap-2 pl-8 pr-3 py-1 cursor-pointer hover:bg-zinc-800 ${
                        selectedVariationId === variation.id ? 'bg-zinc-800 border-l-2 border-violet-500' : ''
                      }`}
                      draggable
                      onClick={() => {
                        setSelectedVariation(variation.id)
                        openInspector()
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(VARIATION_DRAG_TYPE, variation.id)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({ type: 'variation', id: variation.id, x: e.clientX, y: e.clientY })
                      }}
                    >
                      <span className="text-xs text-zinc-600">◈</span>
                      {editingId?.type === 'variation' && editingId.id === variation.id ? (
                        <div className="flex-1">
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value)
                              setEditError('')
                            }}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit()
                              if (e.key === 'Escape') { setEditingId(null); setEditError('') }
                            }}
                            className={`w-full bg-zinc-700 border rounded px-1 py-0.5 text-xs text-zinc-100 outline-none ${
                              editError ? 'border-red-500' : 'border-violet-500'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {editError && <p className="text-xs text-red-400 mt-0.5">{editError}</p>}
                        </div>
                      ) : (
                        <span className="flex-1 text-xs text-zinc-400">{variation.name}</span>
                      )}
                    </li>
                  ))}
                  {componentVariations.length === 0 && (
                    <li className="pl-8 pr-3 py-1 text-xs text-zinc-600 italic">No variations yet</li>
                  )}
                </ul>
              )}
            </li>
          )
        })}
        {sortedComponents.length === 0 && (
          <li className="px-3 py-3 text-xs text-zinc-600 italic">No components yet</li>
        )}
      </ul>

      {contextMenu && (
        <div
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
          className="bg-zinc-900 border border-zinc-700 rounded py-1 shadow-xl min-w-36"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'component' && (
            <>
              <button
                className="block w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                onClick={() => {
                  const c = components[contextMenu.id]
                  if (c) startEditComponent(c)
                  setContextMenu(null)
                }}
              >
                Rename
              </button>
              <button
                className="block w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                onClick={() => {
                  const c = components[contextMenu.id]
                  if (c) setSchemaModal({ component: c })
                  setContextMenu(null)
                }}
              >
                Edit Schema
              </button>
              <button
                className="block w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-800"
                onClick={() => {
                  if (window.confirm('Delete this component and all its variations?')) {
                    deleteComponent(contextMenu.id)
                  }
                  setContextMenu(null)
                }}
              >
                Delete
              </button>
            </>
          )}
          {contextMenu.type === 'variation' && (
            <>
              <button
                className="block w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                onClick={() => {
                  const v = variations[contextMenu.id]
                  if (v) {
                    setEditingId({ type: 'variation', id: v.id })
                    setEditValue(v.name)
                    setEditError('')
                  }
                  setContextMenu(null)
                }}
              >
                Rename
              </button>
              <button
                className="block w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-800"
                onClick={() => {
                  deleteVariation(contextMenu.id)
                  setContextMenu(null)
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {schemaModal !== null && (
        <ComponentSchemaModal
          {...(schemaModal.component ? { component: schemaModal.component } : {})}
          onSave={(name, schema, defaults) => {
            if (schemaModal.component) {
              renameComponent(schemaModal.component.id, name)
              updateComponentSchema(schemaModal.component.id, schema)
              updateComponentDefaults(schemaModal.component.id, defaults)
            } else {
              const c = createComponent(name, { schema, defaults })
              setExpandedComponents((prev) => new Set([...prev, c.id]))
            }
            setSchemaModal(null)
          }}
          onClose={() => setSchemaModal(null)}
        />
      )}
    </div>
  )
}

// ── ComponentSchemaModal ──────────────────────────────────────────────────────

interface ComponentSchemaModalProps {
  component?: Component
  onSave: (name: string, schema: FieldSchema[], defaults: Record<string, string>) => void
  onClose: () => void
}

function ComponentSchemaModal({ component, onSave, onClose }: ComponentSchemaModalProps) {
  const [name, setName] = useState(component?.name ?? '')
  const [defaultTitle, setDefaultTitle] = useState(component?.defaults.title ?? '')
  const [defaultContent, setDefaultContent] = useState(component?.defaults.content ?? '')
  const [fields, setFields] = useState<FieldSchema[]>(component?.schema ?? [])
  const nameRef = useRef<HTMLInputElement>(null)

  const isEditing = component !== undefined

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function addField() {
    setFields((prev) => [...prev, { name: '', type: 'string' as FieldType }])
  }

  function updateField(index: number, partial: Partial<FieldSchema>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...partial } : f)))
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const validFields = fields.filter((f) => f.name.trim())

    onSave(trimmedName, validFields, { title: defaultTitle, content: defaultContent })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-96 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">
            {isEditing ? `Edit Component: ${component.name}` : 'New Component'}
          </h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-sm">✕</button>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Component Name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            placeholder="e.g. Character, Location..."
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Default Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Default Title <span className="text-zinc-600">(shown on node)</span></label>
          <input
            value={defaultTitle}
            onChange={(e) => setDefaultTitle(e.target.value)}
            placeholder="e.g. {{self.name}}"
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Default Content */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Default Content <span className="text-zinc-600">(shown on node)</span></label>
          <TiptapEditor
            key={component?.id} // reset editor when switching components
            value={defaultContent}
            onChange={(content) => setDefaultContent(content)}
          />
        </div>

        {/* Custom Schema Fields */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-500">Custom Fields</label>
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={field.name}
                onChange={(e) => updateField(i, { name: e.target.value })}
                placeholder="Field name"
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="string">string</option>
                <option value="number">number</option>
              </select>
              <button onClick={() => removeField(i)} className="text-zinc-600 hover:text-red-400 text-xs">✕</button>
            </div>
          ))}
          <button
            onClick={addField}
            className="text-xs text-zinc-500 hover:text-violet-400 text-left"
          >
            + Add Field
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Use <code className="text-violet-400">{'{{self.fieldName}}'}</code> in title/content to reference variation fields.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-sm bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded"
          >
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
