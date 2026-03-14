import { useState } from 'react'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { useSettingsStore } from '../../stores/settings-store'
import { OrganizeSettingsContent } from './OrganizeSettingsModal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettingsStore()
  
  const TABS_CONFIG: { id: string; label: string; content: React.ReactNode }[] = [
    {
      id: 'tools',
      label: 'Tools',
      content: <OrganizeSettingsContent />
    },
    {
      id: 'appearance',
      label: 'Appearance',
      content: (
        <div className="py-tk-4">
          <BaseText variant="dim">Appearance settings coming soon...</BaseText>
        </div>
      )
    }
  ]

  const [activeTabId, setActiveTabId] = useState(TABS_CONFIG?.[0]?.id)

  if (!isOpen) return null

  const activeTab = TABS_CONFIG.find((t) => t.id === activeTabId)

  return (
    <div className="bg-bg-surface border border-border-main w-[600px] h-[500px] rounded-tk-xl shadow-2xl flex overflow-hidden pointer-events-auto">
      {/* Sidebar */}
      <aside className="w-tk-48 bg-bg-header border-r border-border-main p-tk-4 flex flex-col gap-[4px]">
        <BaseText size="xs" weight="bold" variant="dim" className="uppercase tracking-wider mb-tk-6 px-tk-2">
          Settings
        </BaseText>
        
        {TABS_CONFIG.map((tab) => (
          <BaseButton
            key={tab.id}
            variant="ghost"
            rounded
            size="md"
            onClick={() => setActiveTabId(tab.id)}
            className={`justify-start transition-colors ${
              activeTabId === tab.id 
                ? 'bg-bg-surface text-text-main' 
                : 'text-text-dim opacity-70 hover:opacity-100'
            }`}
          >
            {tab.label}
          </BaseButton>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col bg-bg-surface">
        <div className="flex-1 p-tk-8 overflow-y-auto">
          {activeTab?.content}
        </div>

        <footer className="p-tk-2 bg-bg-header border-t border-border-main flex justify-between items-center">
          <BaseButton 
            variant="ghost" 
            size="sm" 
            onClick={() => settings.resetToDefaults()}
          >
            Reset to Defaults
          </BaseButton>
          <BaseButton 
            size="md" 
            onClick={onClose} 
            className="border border-border-main hover:bg-bg-surface"
          >
            Done
          </BaseButton>
        </footer>
      </main>
    </div>
  )
}