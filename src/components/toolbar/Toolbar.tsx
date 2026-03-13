import { useState } from 'react'
import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import { usePlayStore } from '../../stores/play-store'
import McpButton from '../mcp/McpButton'
import OrganizeButton from './OrganizeButton'
import SettingsModal from './SettingsModal'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseBadge } from '../primitives/BaseBadge'
import { useModalStore } from '@/stores/modal-store'
import { FabletoriaIcon } from '../primitives/FabletoriaIcon'
import { BaseVerticalSeparator } from '../primitives/BaseVerticalSeparator'

export default function Toolbar() {
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const narrative = useProjectStore((s) => (activeNarrativeId ? s.narratives[activeNarrativeId] : null))
  const playStart = usePlayStore((s) => s.start)
  const modalStore = useModalStore();
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
    <header className="flex items-center justify-between px-tk-4 py-tk-2 bg-bg-header border-b border-border-main shrink-0">
      <div className="flex items-center gap-tk-3">
        <div className='h-[32px]'>
          <FabletoriaIcon />
        </div>

        {narrative && (
          <BaseText size="sm" variant="dim">{narrative.name}</BaseText>
        )}
      </div>
      

      <div className="flex items-center gap-tk-3">
        {showNoStartWarning && (
          <BaseBadge variant="warning" rounded>
            Right-click a node → Set as Start Node
          </BaseBadge>
        )}


        <McpButton />

        <BaseVerticalSeparator/>

        <OrganizeButton />

      
        <BaseButton
          variant="ghost"
          size="sm"
          onClick={() => modalStore.openModal('AssetManager')}
          title="Assets"
        >
          <BaseIcon name="Package" size={18} />
        </BaseButton>
        

        <BaseButton
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={!activeNarrativeId}
        >
          <BaseIcon name="Play" size={18} />
        </BaseButton>


        <BaseVerticalSeparator/>


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
