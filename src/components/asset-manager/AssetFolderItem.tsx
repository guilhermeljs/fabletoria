import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'

interface Props {
  path: string
  onClick: () => void
  onDelete: () => void
}

export default function AssetFolderItem({ path, onClick, onDelete }: Props) {
  const name = path.split('/').pop() ?? path

  return (
    <div
      className="group relative flex flex-col items-center justify-center rounded-tk-lg border border-border-main hover:border-border-light bg-bg-surface cursor-pointer transition-colors"
      style={{ height: '120px' }}
      onClick={onClick}
    >
      <BaseIcon name="Folder" size={36} className="text-brand-primary mb-tk-2" />
      <BaseText size="xs" variant="dim" className="truncate max-w-full px-2">{name}</BaseText>

      <BaseButton
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-1 right-1 text-text-dim hover:text-status-error opacity-0 group-hover:opacity-100 p-1 min-w-0 h-auto"
        title="Delete folder"
      >
        <BaseIcon name="Trash2" size={14} />
      </BaseButton>
    </div>
  )
}
