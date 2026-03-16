import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import type { EntityId, Component } from '../../lib/types'
import { useModalStore } from '../../stores/modal-store'
import { useContextMenuStore } from '../../stores/context-menu-store'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { ComponentListItem } from './ComponentListItem'
import { VariationListItem } from './VariationListItem'

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
  const setSelection = useUIStore((s) => s.setSelection)
  const openInspector = useUIStore((s) => s.openInspector)
  const modalStore = useModalStore()
  const openMenu = useContextMenuStore((s) => s.open)

  const [expandedComponents, setExpandedComponents] = useState<Set<EntityId>>(new Set())
  const [editingId, setEditingId] = useState<{ type: 'component' | 'variation'; id: EntityId } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

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

  function handleSelectVariation(variationId: EntityId) {
    setSelection([{ type: 'variation', id: variationId }])
    openInspector()
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
      handleSelectVariation(result.variation.id)
      openInspector()
    }
  }

  const sortedComponents = Object.values(components).filter(Boolean).sort((a, b) => (a?.createdAt ?? 0) - (b?.createdAt ?? 0)) as Component[]

  return (
    <div>
      <div className="flex items-center justify-between px-tk-3 py-tk-2">
        <BaseText size="xs" weight="semibold" variant="dim" className="uppercase tracking-wider">
          Components
        </BaseText>
        <BaseButton
          variant="ghost"
          size="sm"
          onClick={() => modalStore.openModal('ComponentSchema', {
            onSave: (name, schema, defaults) => {
              const c = createComponent(name, { schema, defaults })
              setExpandedComponents((prev) => new Set([...prev, c.id]))
              modalStore.closeModal()
            }
          })}
          title="New component"
        >
          <BaseIcon name="Plus" size={16} />
        </BaseButton>
      </div>

      <ul className="flex flex-col">
        {sortedComponents.map((component) => {
          const componentVariations = Object.values(variations)
            .filter((v) => v?.componentId === component.id)
            .filter(Boolean) as typeof variations[string][]

          const isExpanded = expandedComponents.has(component.id)

          return (
            <li key={component.id}>
              <ComponentListItem
                component={component}
                isExpanded={isExpanded}
                isEditing={editingId?.type === 'component' && editingId.id === component.id}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onToggleExpand={() => toggleExpand(component.id)}
                onStartEdit={() => startEditComponent(component)}
                onCommitEdit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  openMenu(e.clientX, e.clientY, [
                    {
                      label: 'Rename',
                      icon: 'Pencil',
                      onClick: () => {
                        const c = components[component.id]
                        if (c) startEditComponent(c)
                      },
                    },
                    {
                      label: 'Edit Schema',
                      icon: 'Settings2',
                      onClick: () => {
                        const c = components[component.id]
                        if (c) {
                          modalStore.openModal('ComponentSchema', {
                            component: c,
                            onSave: (name, schema, defaults) => {
                              renameComponent(c.id, name)
                              updateComponentSchema(c.id, schema)
                              updateComponentDefaults(c.id, defaults)
                              modalStore.closeModal()
                            },
                          })
                        }
                      },
                    },
                    { type: 'separator' },
                    {
                      label: 'Delete',
                      icon: 'Trash2',
                      variant: 'danger',
                      onClick: () => {
                        modalStore.openModal('Confirm', {
                          title: 'Delete Component',
                          message: 'Are you sure you want to delete this component and all its variations? This action cannot be undone.',
                          confirmLabel: 'Delete Component',
                          onConfirm: () => deleteComponent(component.id),
                        })
                      },
                    },
                  ])
                }}
                onAddVariation={() => handleAddVariation(component.id)}
                inputRef={inputRef as React.RefObject<HTMLInputElement>}
              />

              {/* Variations */}
              {isExpanded && (
                <ul>
                  {(componentVariations as NonNullable<typeof variations[string]>[]).map((variation) => (
                    <VariationListItem
                      key={variation.id}
                      variation={variation}
                      isSelected={selectedVariationId === variation.id}
                      isEditing={editingId?.type === 'variation' && editingId.id === variation.id}
                      editValue={editValue}
                      editError={editError}
                      onEditValueChange={(v) => { setEditValue(v); setEditError(''); }}
                      onSelect={() => handleSelectVariation(variation.id)}
                      onStartEdit={() => {
                        setEditingId({ type: 'variation', id: variation.id });
                        setEditValue(variation.name);
                        setEditError('');
                      }}
                      onCommitEdit={commitEdit}
                      onCancelEdit={() => { setEditingId(null); setEditError(''); }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        openMenu(e.clientX, e.clientY, [
                          {
                            label: 'Rename',
                            icon: 'Pencil',
                            onClick: () => {
                              setEditingId({ type: 'variation', id: variation.id })
                              setEditValue(variation.name)
                              setEditError('')
                            },
                          },
                          { type: 'separator' },
                          {
                            label: 'Delete',
                            icon: 'Trash2',
                            variant: 'danger',
                            onClick: () => {
                              modalStore.openModal('Confirm', {
                                title: 'Delete Variation',
                                message: 'Are you sure you want to delete this variation? This action cannot be undone.',
                                confirmLabel: 'Delete Variation',
                                onConfirm: () => deleteVariation(variation.id),
                              })
                            },
                          },
                        ])
                      }}
                      inputRef={inputRef as React.RefObject<HTMLInputElement>}
                    />
                  ))}
                  {componentVariations.length === 0 && (
                    <li className="pl-tk-8 pr-tk-3 py-tk-1">
                      <BaseText size="xs" variant="dim" italic>No variations yet</BaseText>
                    </li>
                  )}
                </ul>
              )}
            </li>
          )
        })}
        {sortedComponents.length === 0 && (
          <li className="px-tk-3 py-tk-3">
            <BaseText size="xs" variant="dim" italic>No components yet</BaseText>
          </li>
        )}
      </ul>
    </div>
  )
}
