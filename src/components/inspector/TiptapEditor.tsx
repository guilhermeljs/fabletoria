import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { VariableNode } from '../../lib/tiptap-variable-node'
import { AssetImageNode } from '../../extensions/AssetImageNode'
import { AssetFileNode } from '../../extensions/AssetFileNode'
import type { Asset } from '../../lib/types'
import { useModalStore } from '@/stores/modal-store'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const modalStore = useModalStore()

  const editor = useEditor({
    extensions: [StarterKit, VariableNode, AssetImageNode, AssetFileNode],
    content: value ? JSON.parse(value) : undefined,
    onUpdate: ({ editor }) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onChange(JSON.stringify(editor.getJSON()))
      }, 300)
    }
  })

  const handleAssetSelect = (asset: Asset) => {
    if (!editor) return
    if (asset.type === 'image') {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'assetImage',
          attrs: {
            assetId: asset.id,
            width: '100%',
            height: null,
            marginTop: 0,
            marginRight: 0,
            marginBottom: 16,
            marginLeft: 0
          }
        })
        .run()
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'assetFile',
          attrs: { assetId: asset.id, label: asset.name }
        })
        .run()
    }
  }

  return (
    <div className="flex flex-col gap-2" onMouseDown={(e) => e.stopPropagation()}>
      {/* Toolbar */}
      <div className="flex gap-1 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleBold().run()
          }}
          className={`px-2 py-1 text-xs rounded border ${
            editor?.isActive('bold')
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-transparent border-zinc-600 text-zinc-400 hover:border-zinc-400'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleItalic().run()
          }}
          className={`px-2 py-1 text-xs rounded border italic ${
            editor?.isActive('italic')
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-transparent border-zinc-600 text-zinc-400 hover:border-zinc-400'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleBulletList().run()
          }}
          className={`px-2 py-1 text-xs rounded border ${
            editor?.isActive('bulletList')
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-transparent border-zinc-600 text-zinc-400 hover:border-zinc-400'
          }`}
        >
          ≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            modalStore.openModal('AssetManager', { mode: 'select', onSelect: handleAssetSelect })
          }}
          className="px-2 py-1 text-xs rounded border bg-transparent border-zinc-600 text-zinc-400 hover:border-zinc-400"
          title="Insert asset"
        >
          📎
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="narrative-content text-sm text-text-main bg-bg-surface min-h-[80px] border border-border-main rounded-tk-md p-2 focus-within:border-brand-primary transition-colors"
      />
    </div>
  )
}
