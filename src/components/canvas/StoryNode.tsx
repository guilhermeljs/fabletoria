import { memo, useState, useRef, useCallback } from 'react'
import { NodeProps, NodeResizer } from '@xyflow/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { generateHTML } from '@tiptap/core'
import { VariableNode } from '../../lib/tiptap-variable-node'
import { AssetImageNode } from '../../extensions/AssetImageNode'
import { AssetFileNode } from '../../extensions/AssetFileNode'
import { resolveContent, resolveTitle } from '../../lib/interpolation'
import { useProjectStore } from '../../stores/project-store'
import { useAssetStore } from '../../stores/asset-store'
import { BaseNode } from '../primitives/BaseNode'
import { BaseBadge } from '../primitives/BaseBadge'

export interface StoryNodeData {
  content: string
  title: string
  isStartNode: boolean
  variationName?: string
  variationId?: string
  [key: string]: unknown
}

const EXTENSIONS = [StarterKit, VariableNode, AssetImageNode, AssetFileNode]

function parseContent(raw: string): object {
  try {
    return JSON.parse(raw) as object
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
}

const InlineEditor = ({
  nodeId,
  initialContent,
  onClose
}: {
  nodeId: string
  initialContent: string
  onClose: () => void
}) => {
  const updateNodeContent = useProjectStore((s) => s.updateNodeContent)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: parseContent(initialContent),
    autofocus: true
  })

  const close = useCallback(() => {
    if (editor) {
      updateNodeContent(nodeId, JSON.stringify(editor.getJSON()))
    }
    onClose()
  }, [nodeId, editor, updateNodeContent, onClose])

  return (
    <EditorContent
      ref={containerRef}
      editor={editor}
      onBlur={close}
      className="nodrag narrative-content outline-none min-h-[1rem]"
    />
  )
}

export const StoryNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as StoryNodeData
  const variations = useProjectStore((s) => s.variations)
  const updateNodeTitle = useProjectStore((s) => s.updateNodeTitle)
  const updateNodeSize = useProjectStore((s) => s.updateNodeSize)
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition)
  const assets = useAssetStore((s) => s.assets)

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [titleValue, setTitleValue] = useState(nodeData.title ?? '')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const variation = nodeData.variationId ? variations[nodeData.variationId] : undefined
  const displayTitle = resolveTitle(nodeData.title ?? '', variation?.values)

  let html = ''
  try {
    const parsed = parseContent(nodeData.content)
    const { html: resolved } = resolveContent(parsed, variations, variation?.values, assets)
    html = resolved
  } catch {
    html = generateHTML(parseContent(nodeData.content), EXTENSIONS)
  }

  const commitTitle = useCallback(() => {
    if (titleValue !== nodeData.title) {
      updateNodeTitle(id as string, titleValue)
    }
    setEditingTitle(false)
  }, [id, titleValue, nodeData.title, updateNodeTitle])

  return (
    <BaseNode
      selected={selected}
      label={editingTitle ? 'undefined' : displayTitle}
      color={nodeData.isStartNode ? 'var(--tk-color-status-success)' : 'RED'}
      onTitleClick={() => !variation && setEditingTitle(true)}
      className="relative"
    >
      {selected && (
        <NodeResizer
          onResizeEnd={(_e, params) => {
            updateNodeSize(id as string, params.width, params.height)
            updateNodePosition(id as string, { x: params.x, y: params.y })
          }}
          minWidth={100}
          minHeight={40}
        />
      )}

      {editingTitle ? (
        <input
          ref={titleInputRef}
          className="w-full bg-transparent border-none outline-none text-tk-sm font-semibold nodrag"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
          autoFocus
        />
      ) : null}

      <div className="flex flex-wrap gap-tk-1 mb-tk-2">
        {nodeData.isStartNode && (
          <BaseBadge variant="success" size="xs">
            START
          </BaseBadge>
        )}
        {nodeData.variationName && (
          <BaseBadge variant="primary" size="xs">
            {nodeData.variationName}
          </BaseBadge>
        )}
      </div>

      {editingContent ? (
        <InlineEditor
          nodeId={id}
          initialContent={nodeData.content}
          onClose={() => setEditingContent(false)}
        />
      ) : (
        <div
          className="narrative-content cursor-text text-tk-sm min-h-[1rem]"
          dangerouslySetInnerHTML={{ __html: html }}
          onDoubleClick={() => setEditingContent(true)}
        />
      )}
    </BaseNode>
  )
})

StoryNode.displayName = 'StoryNode'

export default StoryNode
