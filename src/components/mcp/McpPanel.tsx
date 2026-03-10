import { useMcp } from '../../hooks/useMcp'
import type { McpServerStatus } from '../../stores/mcp-store'

interface Props {
  onClose: () => void
}

function StatusDot({ status }: { status: McpServerStatus }) {
  const colors: Record<McpServerStatus, string> = {
    stopped: 'bg-zinc-500',
    starting: 'bg-yellow-400 animate-pulse',
    running: 'bg-green-400',
    stopping: 'bg-orange-400 animate-pulse'
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />
}

function statusLabel(status: McpServerStatus): string {
  return { stopped: 'Not running', starting: 'Starting…', running: 'Running', stopping: 'Stopping…' }[status]
}

export default function McpPanel({ onClose }: Props) {
  const { status, url, error, start, stop } = useMcp()
  const isRunning = status === 'running'
  const isBusy = status === 'starting' || status === 'stopping'

  async function copyUrl() {
    if (url) await navigator.clipboard.writeText(url)
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">MCP Server</span>
          <StatusDot status={status} />
          <span className="text-xs text-zinc-400">{statusLabel(status)}</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-sm leading-none"
          aria-label="Close MCP panel"
        >
          ✕
        </button>
      </div>

      {/* Connection URL */}
      {isRunning && url && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Connection URL</span>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
            <code className="text-xs text-green-400 flex-1 truncate">{url}</code>
            <button
              onClick={copyUrl}
              className="text-xs text-zinc-400 hover:text-zinc-200 shrink-0"
              title="Copy URL"
            >
              Copy
            </button>
          </div>


          <p className="text-xs text-zinc-500 mt-2">
            Paste this command to use in Claude
          </p>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
            <code className="text-xs text-zinc-200 flex-1 truncate">claude mcp add narrativeflow --transport sse --scope user http://localhost:7700/sse</code>
            <button
              onClick={copyUrl}
              className="text-xs text-zinc-400 hover:text-zinc-200 shrink-0"
              title="Copy command"
            >
              Copy
            </button>
          </div>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Start / Stop */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={start}
            disabled={isBusy}
            className="flex-1 px-3 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'starting' ? 'Starting…' : 'Start MCP'}
          </button>
        ) : (
          <button
            onClick={stop}
            disabled={isBusy}
            className="flex-1 px-3 py-2 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isBusy ? 'Stopping…' : 'Stop MCP'}
          </button>
        )}
      </div>

      {/* Info */}
      {!isRunning && !error && (
        <p className="text-xs text-zinc-500">
          Start the MCP server to enable AI-assisted authoring via compatible clients.
        </p>
      )}
    </div>
  )
}
