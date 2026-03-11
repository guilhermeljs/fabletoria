import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useAssetStore } from '../stores/asset-store'

// ── NodeView component ────────────────────────────────────────────────────────

function AssetFileView({ node }: NodeViewProps) {
  const { assetId, label } = node.attrs as { assetId: string; label: string }
  const asset = useAssetStore((s) => s.assets[assetId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!asset) return

    if (asset.sourceType === 'url' && asset.url) {
      window.open(asset.url, '_blank', 'noopener,noreferrer')
      return
    }

    if (asset.sourceType === 'local' && asset.data) {
      const url = URL.createObjectURL(asset.data)
      const a = document.createElement('a')
      a.href = url
      a.download = asset.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!asset) {
    return (
      <NodeViewWrapper as="span">
        <span
          title="Asset deleted"
          style={{ textDecoration: 'line-through', color: '#71717a', cursor: 'default' }}
        >
          📎 {label}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span">
      <a
        href="#"
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          color: '#a78bfa',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: 'inherit'
        }}
      >
        📎 {label}
      </a>
    </NodeViewWrapper>
  )
}

// ── Tiptap Node definition ────────────────────────────────────────────────────

export const AssetFileNode = Node.create({
  name: 'assetFile',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      assetId: { default: null },
      label: { default: '' }
    }
  },

  parseHTML() {
    return [{ tag: 'asset-file' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['asset-file', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetFileView)
  }
})
