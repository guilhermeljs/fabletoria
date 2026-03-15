import { useState } from 'react'
import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import { usePlayStore } from '../../stores/play-store'
import { useRealtimeStore } from '../../stores/realtime-store'
import McpButton from '../mcp/McpButton'
import OrganizeButton from './OrganizeButton'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseBadge } from '../primitives/BaseBadge'
import { BaseBalloon } from '../primitives/BaseBalloon'
import { useModalStore } from '@/stores/modal-store'
import { FabletoriaIcon } from '../primitives/FabletoriaIcon'
import { BaseVerticalSeparator } from '../primitives/BaseVerticalSeparator'

export default function Toolbar() {
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const narrative = useProjectStore((s) => (activeNarrativeId ? s.narratives[activeNarrativeId] : null))
  const playStart = usePlayStore((s) => s.start)
  const modalStore = useModalStore()
  const realtimeMode = useRealtimeStore((s) => s.mode)
  const invites = useRealtimeStore((s) => s.invites)
  const clientStatus = useRealtimeStore((s) => s.clientStatus)
  const [showNoStartWarning, setShowNoStartWarning] = useState(false)
  const [showShareBalloon, setShowShareBalloon] = useState(true)

  const isClientMode = realtimeMode === 'client'
  const hasConnectedClient = invites.some((i) => i.status === 'connected')
  const clientConnected = clientStatus === 'connected'

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
    <header className="flex items-center justify-between px-tk-4 py-tk-2 bg-bg-header border-b border-border-main shrink-0">
      <div className="flex items-center gap-tk-3">
        <div className="h-[32px]">
          <FabletoriaIcon />
        </div>

        {narrative && (
          <BaseText size="sm" variant="dim" className="max-w-[24ch] truncate block">
            {narrative.name}
          </BaseText>
        )}
      </div>

      <div className="flex items-center gap-tk-3">
        {showNoStartWarning && (
          <BaseBadge variant="warning" rounded>
            Right-click a node → Set as Start Node
          </BaseBadge>
        )}

        <BaseButton
          variant="secondary"
          size="sm"
          onClick={() => window.open('https://github.com/fabletoria/narrativeflow', '_blank')}
          title="Star us on GitHub"
        >
          <BaseIcon name="Github" size={14} />
          <span className="ml-tk-1">Star us on Github</span>
        </BaseButton>

        {!isClientMode && (
          <div className="relative">
            <BaseButton
              variant={hasConnectedClient ? 'success' : 'secondary'}
              size="sm"
              onClick={() => modalStore.openModal('Share')}
              title={hasConnectedClient ? 'Sharing project' : 'Collaborate in real time'}
            >
              <BaseIcon name="Share2" size={14} />
              <span className="ml-tk-1">{hasConnectedClient ? 'Live now' : 'Share'}</span>
              {!hasConnectedClient && (
                <BaseBadge size="xs" rounded variant="primary" className="ml-tk-1">
                  Beta
                </BaseBadge>
              )}
            </BaseButton>

            <BaseBalloon
              isOpen={showShareBalloon}
              title={
                <>
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{
                      background: 'linear-gradient(to right, #f472b6, #a855f7, #6366f1)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.3))'
                    }}
                  >
                    NEW
                  </span>
                  <span className="ml-tk-1 text-xs font-bold">Live Team Collaboration</span>
                </>
              }
              distance={20}
              message={
                <BaseText size="sm">
                  <div className="inline-table whitespace-nowrap opacity-80">
                    Collaborate with your team in real time.
                  </div>
                  <div className="inline-block mt-tk-1 opacity-60">
                    Beta feature, we’re actively stabilizing it. Occasional bugs or disconnects may
                    occur. Your feedback helps improve it.
                  </div>
                </BaseText>
              }
              placement="bottom"
              onClose={() => setShowShareBalloon(false)}
            />
          </div>
        )}

        {isClientMode && (
          <BaseBadge variant={clientConnected ? 'success' : 'info'} rounded>
            {clientConnected ? 'As Guest' : 'Connecting...'}
          </BaseBadge>
        )}

        <McpButton />

        <BaseVerticalSeparator />

        <OrganizeButton />

        <BaseButton
          variant="ghost"
          size="sm"
          onClick={() => modalStore.openModal('AssetManager')}
          title="Assets"
        >
          <BaseIcon name="Package" size={18} />
        </BaseButton>

        <BaseButton variant="ghost" size="sm" onClick={handlePlay} disabled={!activeNarrativeId}>
          <BaseIcon name="Play" size={18} />
        </BaseButton>

        <BaseVerticalSeparator />

        <BaseButton
          variant="ghost"
          size="sm"
          onClick={() => modalStore.openModal('Settings')}
          title="Settings"
        >
          <BaseIcon name="Settings" size={18} />
        </BaseButton>
      </div>
    </header>
  )
}
