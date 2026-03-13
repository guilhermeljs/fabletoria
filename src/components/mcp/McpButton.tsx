import { useState } from 'react'
import { isElectron } from '../../lib/platform'
import { useMcpStore } from '../../stores/mcp-store'
import McpPanel from './McpPanel'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

export default function McpButton() {
  const [panelOpen, setPanelOpen] = useState(false)
  const desktop = isElectron()

  if (!desktop) {
    return (
      
      <div className="relative group">
        <BaseButton
              variant="ghost"
              size="sm"
              title="This feature is available only on desktop app"
              disabled

              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((v) => !v)}
            >
              <BaseIcon name="Wand" size={18} />
              <div className={"px-2"}>
                <BaseText size='xs'>MCP</BaseText>
              </div>
          </BaseButton>

          <div className="absolute flex justify-center items-center bottom-full right-0 top-[32px] px-tk-2 py-tk-2 bg-bg-header text-zinc-300 text-xs rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <BaseText size="xs" variant='dim'>This feature is available only in the desktop app</BaseText>
          </div>
      </div>
    )
  }

  return (
    <div className="relative">
    <BaseButton
      variant="ghost"
      size="sm"
      title="MCP server"
      aria-expanded={panelOpen}
      onClick={() => setPanelOpen((v) => !v)}
      className="hover:bg-white/5 transition-all duration-300"
    >
      <div className="flex items-center group">
        <div className="relative">
          <BaseIcon 
            name="Wand" 
            size={18} 
            className="text-[#f472b6] group-hover:scale-110 transition-transform"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(244, 114, 182, 0.5))'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#f472b6] to-[#6366f1] mix-blend-screen opacity-50 blur-[2px]" />
        </div>

        <div className="px-2">
          <span 
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: 'linear-gradient(to right, #f472b6, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.3))'
            }}
          >
            MCP
          </span>
        </div>
      </div>
    </BaseButton>

      {panelOpen && <McpPanel onClose={() => setPanelOpen(false)} />}
    </div>
  )
}
