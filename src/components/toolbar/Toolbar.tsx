import { useState } from 'react'
import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import { usePlayStore } from '../../stores/play-store'
import { isElectron } from '../../lib/platform'

export default function Toolbar() {
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const narrative = useProjectStore((s) => (activeNarrativeId ? s.narratives[activeNarrativeId] : null))
  const playStart = usePlayStore((s) => s.start)
  const [showNoStartWarning, setShowNoStartWarning] = useState(false)

  const handlePlay = () => {
    if (!activeNarrativeId || !narrative) return
    if (!narrative.startNodeId) {
      setShowNoStartWarning(true)
      setTimeout(() => setShowNoStartWarning(false), 3000)
      return
    }
    playStart(activeNarrativeId, narrative.startNodeId)
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-violet-400 tracking-tight">
          NarrativeFlow
        </span>
        {narrative && (
          <span className="text-sm text-zinc-500">{narrative.name}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showNoStartWarning && (
          <span className="text-xs text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-700">
            Right-click a node → Set as Start Node
          </span>
        )}

        <button
          onClick={handlePlay}
          disabled={!activeNarrativeId}
          className="px-4 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ▶ Play
        </button>

        {/* Electron-only extension slot: Feature 002 renders MCP button here */}
        {isElectron() && <div id="electron-toolbar-slot" />}
      </div>
    </header>
  )
}
