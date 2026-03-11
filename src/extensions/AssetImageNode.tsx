import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { useAssetStore } from '../stores/asset-store'

// ── NodeView component ────────────────────────────────────────────────────────

function AssetImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { assetId, width, height, marginTop, marginRight, marginBottom, marginLeft } = node.attrs as {
    assetId: string
    width: number | string
    height: number | null
    marginTop: number
    marginRight: number
    marginBottom: number
    marginLeft: number
  }

  const asset = useAssetStore((s) => s.assets[assetId])
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!asset) return undefined
    if (asset.sourceType === 'local' && asset.data) {
      const url = URL.createObjectURL(asset.data)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [asset])

  const imgSrc = asset?.sourceType === 'url' ? asset.url : objectUrl
  const isEditing = !!editor

  // Drag-to-resize state
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const currentWidth = typeof width === 'number' ? width : 300
    resizeRef.current = { startX: e.clientX, startWidth: currentWidth }
    const onMove = (me: PointerEvent) => {
      if (!resizeRef.current) return
      const delta = me.clientX - resizeRef.current.startX
      const newWidth = Math.max(60, resizeRef.current.startWidth + delta)
      updateAttributes({ width: newWidth })
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const containerStyle: React.CSSProperties = {
    display: 'block',
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : undefined,
    marginTop: marginTop,
    marginRight: marginRight,
    marginBottom: marginBottom,
    marginLeft: marginLeft,
    userSelect: 'none'
  }

  if (!asset) {
    return (
      <NodeViewWrapper>
        <div
          style={containerStyle}
          className="flex items-center justify-center bg-zinc-800 border border-zinc-600 rounded text-zinc-500 text-sm gap-2"
        >
          <span>⚠</span>
          <span>Asset deleted</span>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        style={containerStyle}
        onMouseDown={(e) => e.stopPropagation()}
        className={`inline-block ${selected && isEditing ? 'outline outline-2 outline-violet-500' : ''}`}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={asset.name}
            draggable={false}
            style={{ maxWidth: '100%', height: height ? `${height}px` : 'auto', display: 'block' }}
          />
        ) : (
          <div className="flex items-center justify-center bg-zinc-800 rounded h-24 text-zinc-600 text-sm">
            Loading…
          </div>
        )}

        {/* Resize handle (right edge) — only in editor */}
        {isEditing && selected && (
          <>
            <div
              onPointerDown={startResize}
              style={{
                position: 'absolute',
                right: -4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 8,
                height: 32,
                background: 'rgba(139,92,246,0.8)',
                borderRadius: 4,
                cursor: 'ew-resize',
                zIndex: 10
              }}
            />
            {/* Floating margin toolbar */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                left: '50%',
                maxWidth: 200,
                transform: 'translateX(-50%)',
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: 6,
                padding: '4px 8px',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                zIndex: 20,
                whiteSpace: 'nowrap'
              }}
            >
              {(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => (
                <label key={side} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 9, color: '#71717a' }}>{side[0]}</span>
                  <input
                    type="number"
                    value={node.attrs[`margin${side}`] as number}
                    onChange={(e) => updateAttributes({ [`margin${side}`]: Number(e.target.value) })}
                    style={{
                      width: 36,
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: 4,
                      color: '#e4e4e7',
                      fontSize: 10,
                      padding: '1px 4px',
                      textAlign: 'center'
                    }}
                    min={0}
                    max={200}
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// ── Tiptap Node definition ────────────────────────────────────────────────────

export const AssetImageNode = Node.create({
  name: 'assetImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      assetId: { default: null },
      width: { default: '100%' },
      height: { default: null },
      marginTop: { default: 0 },
      marginRight: { default: 0 },
      marginBottom: { default: 16 },
      marginLeft: { default: 0 }
    }
  },

  parseHTML() {
    return [{ tag: 'asset-image' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['asset-image', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetImageView)
  }
})
