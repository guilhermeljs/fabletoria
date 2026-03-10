import { useState } from 'react'
import { isElectron } from '../../lib/platform'
import { useMcpStore } from '../../stores/mcp-store'
import McpPanel from './McpPanel'

export default function McpButton() {
  const [panelOpen, setPanelOpen] = useState(false)
  const status = useMcpStore((s) => s.status)
  const desktop = isElectron()

  if (!desktop) {
    return (
      <div className="relative group">
        <button
          disabled
          className="px-3 py-1.5 text-sm font-medium bg-zinc-800 text-zinc-500 rounded-lg opacity-40 cursor-not-allowed transition-colors"
          aria-label="MCP (desktop only)"
        >
          MCP
        </button>
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
          This feature is available only on desktop app
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
          status === 'running'
            ? 'bg-violet-900 text-violet-200 hover:bg-violet-800'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
        aria-label="MCP server controls"
        aria-expanded={panelOpen}
      >
        {status === 'running' && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
        )}
        MCP
      </button>

      {panelOpen && <McpPanel onClose={() => setPanelOpen(false)} />}
    </div>
  )
}
