import { useState } from 'react'

interface Props {
  path: string
  onClick: () => void
  onDelete: () => void
}

export default function AssetFolderItem({ path, onClick, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false)
  const name = path.split('/').pop() ?? path

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800 cursor-pointer transition-colors"
      style={{ height: '120px' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onClick}
    >
      <span className="text-3xl mb-1">📁</span>
      <span className="text-xs text-zinc-400 truncate max-w-full px-2">{name}</span>

      {showActions && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-1.5 right-1.5 text-zinc-600 hover:text-red-400 transition-colors text-xs leading-none"
          title="Delete folder"
        >
          ✕
        </button>
      )}
    </div>
  )
}
