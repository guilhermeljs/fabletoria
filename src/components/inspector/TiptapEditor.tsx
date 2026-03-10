import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { VariableNode } from '../../lib/tiptap-variable-node'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, VariableNode],
    content: value ? JSON.parse(value) : undefined,
    onUpdate: ({ editor }) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onChange(JSON.stringify(editor.getJSON()))
      }, 300)
    }
  })

  return (
    <div
      className="flex flex-col gap-2"
      onMouseDown={(e) => e.stopPropagation()}
    >
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
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="narrative-content text-sm text-zinc-200 min-h-[80px] border border-zinc-700 rounded p-2 focus-within:border-violet-500 transition-colors"
      />

      <p className="text-xs text-zinc-500">
        Tip: type <code className="text-violet-400">{'{{variationName.fieldName}}'}</code> to insert a variable
      </p>
    </div>
  )
}
