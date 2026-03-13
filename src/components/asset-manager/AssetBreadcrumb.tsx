import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

interface Props {
  path: string
  onNavigate: (path: string) => void
}

export default function AssetBreadcrumb({ path, onNavigate }: Props) {
  const segments = path === '/' ? [] : path.split('/').filter(Boolean)

  const buildPath = (idx: number) => {
    if (idx === -1) return '/'
    return '/' + segments.slice(0, idx + 1).join('/')
  }

  return (
    <nav className="flex items-center gap-tk-1.5">
      <BaseButton variant="ghost" size="sm" onClick={() => onNavigate('/')}>
        <BaseIcon name="Home" size={14} className="mr-tk-2" />
        <BaseText size="xs">Assets</BaseText>
      </BaseButton>
      {segments.map((seg, idx) => (
        <div key={idx} className="flex items-center gap-tk-1.5 text-text-dim">
          <BaseIcon name="ChevronRight" size={16} />
          <BaseButton variant="ghost" size="sm" onClick={() => onNavigate(buildPath(idx))}>
            <BaseText size="sm">{seg}</BaseText>
          </BaseButton>
        </div>
      ))}
    </nav>
  )
}
