import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { generateHTML } from '@tiptap/core'
import { VariableNode } from '../../lib/tiptap-variable-node'
import { AssetImageNode } from '../../extensions/AssetImageNode'
import { AssetFileNode } from '../../extensions/AssetFileNode'
import { resolveContent, resolveTitle } from '../../lib/interpolation'
import { useProjectStore } from '../../stores/project-store'
import { useAssetStore } from '../../stores/asset-store'
import styles from './StoryNodeComponent.module.css'

export interface StoryNodeData {
  content: string
  title: string
  isStartNode: boolean
  variationName?: string
  variationId?: string
  [key: string]: unknown
}

function parseContent(raw: string): object {
  try {
    return JSON.parse(raw) as object
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
}

// ── Inline Tiptap editor shown on double-click ────────────────────────────────

interface InlineEditorProps {
  nodeId: string
  initialContent: string
  onClose: () => void
  onTextOverflowed?: (size: OverflowSize) => void
  
}
type OverflowSize = { width: number; height: number }

function InlineEditor({
  nodeId,
  initialContent,
  onClose,
  onTextOverflowed
}: InlineEditorProps) {
  const updateNodeContent = useProjectStore((s) => s.updateNodeContent)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const wasOverflowed = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit, VariableNode, AssetImageNode, AssetFileNode],
    content: parseContent(initialContent),
    autofocus: true,
  })

  const close = useCallback(() => {
    updateNodeContent(
      nodeId,
      JSON.stringify(editor?.getJSON() ?? parseContent(initialContent))
    )
    onClose()
  }, [nodeId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    if (!editor) return

    const checkOverflow = () => {
      const el = containerRef.current
      if (!el) return

      const overflowX = el.scrollWidth - el.clientWidth
      const overflowY = el.scrollHeight - el.clientHeight

      const overflow = overflowX > 0 || overflowY > 0

      if (!wasOverflowed.current && overflow) {
        wasOverflowed.current = true

        onTextOverflowed?.({
          width: overflowX,
          height: overflowY
        })
      }
    }

    editor.on('update', checkOverflow)

    return () => {
      editor.off('update', checkOverflow)
    }
  }, [editor, onTextOverflowed])

  return (
    <EditorContent
      ref={containerRef}
      editor={editor}
      onBlur={close}
      onMouseDown={(e) => e.stopPropagation()}
      className={`${styles.content} ${styles.contentEditing} nodrag narrative-content`}
    />
  )
}

// ── Main node component ───────────────────────────────────────────────────────

const EXTENSIONS = [StarterKit, VariableNode, AssetImageNode, AssetFileNode]

const StoryNodeComponent = memo(({ data, selected, id, width, height }: NodeProps) => {
  const nodeData = data as StoryNodeData
  const variations = useProjectStore((s) => s.variations)
  const updateNodeTitle = useProjectStore((s) => s.updateNodeTitle)
  const updateNodeSize = useProjectStore((s) => s.updateNodeSize)
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition)
  const assets = useAssetStore((s) => s.assets)

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [titleValue, setTitleValue] = useState(nodeData.title ?? '')
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  // Sync titleValue when external changes come in (e.g. from inspector)
  useEffect(() => {
    if (!editingTitle) setTitleValue(nodeData.title ?? '')
  }, [nodeData.title, editingTitle])

  // Focus input when title editing starts
  useEffect(() => {
    const input = titleInputRef.current
    if (!editingTitle || !input) return

    input.focus()

    requestAnimationFrame(() => {
      const len = input.value.length
      input.setSelectionRange(len, len)
    })
  }, [editingTitle])

  const commitTitle = useCallback(() => {
    if(titleValue !== nodeData.title) {
      updateNodeTitle(id as string, titleValue)
      setEditingTitle(false)
    }
  }, [id, titleValue, updateNodeTitle])

  const variation = nodeData.variationId ? variations[nodeData.variationId] : undefined

  // Resolve content for display
  let html = ''
  try {
    const parsed = parseContent(nodeData.content)
    const { html: resolved } = resolveContent(parsed, variations, variation?.values, assets)
    html = resolved
  } catch {
    html = generateHTML(parseContent(nodeData.content), EXTENSIONS)
  }

  const displayTitle = resolveTitle(nodeData.title ?? '', variation?.values)

  const className = [
    styles.node,
    selected ? styles.selected : '',
    nodeData.isStartNode ? styles.startNode : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      { selected && (
      <NodeResizer
        onResizeEnd={(_e, params) => {
          updateNodeSize(id as string, params.width, params.height)
          updateNodePosition(id as string, { x: params.x, y: params.y })
        }}
        minWidth={100}
        minHeight={40}
        maxWidth={1280}
        maxHeight={1280}
      />) 
      }
      {/* four directional handles: each side can act as both source and target */}
      <Handle type="source" id="bottom" position={Position.Bottom} className={styles.nodeHandle} />
      <Handle type="source" id="top" position={Position.Top} className={styles.nodeHandle} />
      <Handle type="source" id="left" position={Position.Left} className={styles.nodeHandle} />
      <Handle type="source" id="right" position={Position.Right} className={styles.nodeHandle} />

      {/* Header / Title area */}
      <div
        className={styles.header}
        onDoubleClick={(_e) => {
          if (!variation && !editingTitle) setEditingTitle(true)
        }}
        onPointerDown={(e) => { 
          if(editingContent && !variation) {
            (document.activeElement as HTMLElement | null)?.blur()
            setEditingContent(false)
            setEditingTitle(true);
          }
          e.stopPropagation();
      }}
        onMouseDown={(e)=>e.stopPropagation()}
      >
        {nodeData.isStartNode && <span className={styles.startBadge} title="Start node">★</span>}
        {nodeData.variationName && (
          <span className={styles.variationBadge}>{nodeData.variationName}</span>
        )}
        {editingTitle && !variation ? (
          <input
            ref={titleInputRef}
            className={`${styles.titleInput} nodrag`}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setTitleValue(nodeData.title ?? ''); setEditingTitle(false) }
            }}
            onMouseDown={(e)=>e.stopPropagation()}
            placeholder="Title..."
          />
        ) : (
          <span className={`${styles.titleText} ${!displayTitle ? styles.empty : ''}`}>
            {displayTitle || ''}
          </span>
        )}
      </div>

      {/* Content area */}
      {editingContent ? (
        <InlineEditor
          nodeId={id as string}
          initialContent={nodeData.content}
          onClose={() => setEditingContent(false)}
          onTextOverflowed={(size) => { 
            if(!width && size.height == 0) return;
            if(!height && size.width == 0) return;
            updateNodeSize(id as string, (width || 0) + size.width, (height || 0) + size.height) 
          }}
        />
      ) : (
        <div
        style={{
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          className={`${styles.content} narrative-content`}
          dangerouslySetInnerHTML={{ __html: html }}
          onDoubleClick={(_e) => { if(!editingContent) setEditingContent(true) }}
          onPointerDown={(_e) => {
            if(editingTitle) {
              commitTitle();
              setEditingTitle(false);
              setEditingContent(true);
            }
          }}
        />
      )}

    </div>
  )
})

StoryNodeComponent.displayName = 'StoryNodeComponent'

export default StoryNodeComponent
