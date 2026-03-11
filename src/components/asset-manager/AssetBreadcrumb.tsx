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
    <nav className="flex items-center gap-1 text-xs text-zinc-500">
      <button
        onClick={() => onNavigate('/')}
        className="hover:text-zinc-300 transition-colors"
      >
        Assets
      </button>
      {segments.map((seg, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <span className="text-zinc-700">›</span>
          <button
            onClick={() => onNavigate(buildPath(idx))}
            className="hover:text-zinc-300 transition-colors"
          >
            {seg}
          </button>
        </span>
      ))}
    </nav>
  )
}
