import { BaseButton } from '../primitives/BaseButton'
import { BaseBadge } from '../primitives/BaseBadge'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'
import { useMcp } from '../../hooks/useMcp'
import type { McpServerStatus } from '../../stores/mcp-store'
import { copyToClipboard } from '../../lib/clipboard'

interface Props {
  onClose: () => void
}

function statusLabel(status: McpServerStatus): string {
  return { stopped: 'Not running', starting: 'Starting…', running: 'Running', stopping: 'Stopping…' }[status]
}

function statusBadge(status: McpServerStatus) {
  const variants = {
    stopped: 'default',
    starting: 'warning',
    running: 'success',
    stopping: 'warning'
  } as const

  const extraClasses = {
    stopped: '',
    starting: 'animate-pulse',
    running: '',
    stopping: 'animate-pulse'
  } as const

  return (
    <BaseBadge
      variant={variants[status]}
      size="xs"
      rounded
      className={extraClasses[status]}
    >
      {statusLabel(status)}
    </BaseBadge>
  )
}

export default function McpPanel({ onClose }: Props) {
  const { status, url, error, start, stop } = useMcp()
  const isRunning = status === 'running'
  const isBusy = status === 'starting' || status === 'stopping'

  async function copyUrl() {
    if (url) await copyToClipboard(url)
  }

  async function copyText(text: string) {
    await copyToClipboard(text)
  }

  return (
    <div className="absolute top-10 right-0 w-80 bg-bg-surface border border-border-main rounded-tk-xl shadow-2xl z-50 px-tk-4 pt-tk-2 pb-tk-4 flex flex-col gap-tk-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-tk-2">
          <BaseText size="sm" weight="semibold">
            MCP Server
          </BaseText>
          {statusBadge(status)}
        </div>

        <BaseButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close MCP panel"
          className="h-8 w-8 p-0"
        >
          <BaseIcon name="X" size={16} />
        </BaseButton>
      </div>

      {/* Connection URL */}
      {isRunning && url && (
        <div className="flex flex-col gap-tk-2">
          <BaseText size="xs" variant="dim">
            Connection URL
          </BaseText>

          <div className="flex items-center gap-tk-2 bg-bg-header rounded-tk-lg px-tk-3 py-tk-2">
            <code className="flex-1 truncate font-content text-tk-xs text-text-dim">
              {url}
            </code>
            <BaseButton size="sm" variant="ghost" onClick={copyUrl} className="shrink-0">
              Copy
            </BaseButton>
          </div>

          <BaseText size="xs" variant="dim" className="mt-tk-2">
            Paste this command to use in Claude
          </BaseText>

          <div className="flex items-center gap-tk-2 bg-bg-header rounded-tk-lg px-tk-3 py-tk-2">
            <code className="flex-1 truncate font-content text-tk-xs text-text-dim">
              claude mcp add fabletoria --transport sse --scope user http://localhost:7700/sse
            </code>
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={() => copyText('claude mcp add fabletoria --transport sse --scope user http://localhost:7700/sse')}
              className="shrink-0"
            >
              Copy
            </BaseButton>
          </div>

          <BaseText size="xs" variant="dim" className="mt-tk-2">
            Paste this command to use in Gemini
          </BaseText>

          <div className="flex items-center gap-tk-2 bg-bg-header rounded-tk-lg px-tk-3 py-tk-2">
            <code className="flex-1 truncate font-content text-tk-xs text-text-dim">
              gemini mcp add --transport sse fabletoria http://localhost:7700/sse
            </code>
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={() => copyText('gemini mcp add --transport sse fabletoria http://localhost:7700/sse')}
              className="shrink-0"
            >
              Copy
            </BaseButton>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-status-error/10 border border-status-error rounded-tk-lg px-tk-3 py-tk-2">
          <BaseText size="xs" variant="error">
            {error}
          </BaseText>
        </div>
      )}

      {/* Start / Stop */}
      <div className="flex gap-tk-2">
        {!isRunning ? (
          <BaseButton
            variant="primary"
            size="md"
            fullWidth
            isLoading={isBusy}
            onClick={start}
          >
            {status === 'starting' ? 'Starting…' : 'Start MCP'}
          </BaseButton>
        ) : (
          <BaseButton
            variant="secondary"
            size="md"
            fullWidth
            isLoading={isBusy}
            onClick={stop}
          >
            {isBusy ? 'Stopping…' : 'Stop MCP'}
          </BaseButton>
        )}
      </div>

      {/* Info */}
      {!isRunning && !error && (
        <BaseText size="xs" variant="dim">
          Start the MCP server to enable AI-assisted authoring via compatible clients.
        </BaseText>
      )}
    </div>
  )
}
