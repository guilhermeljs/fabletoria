import { useEffect, useRef, useState } from 'react'
import { db } from './lib/db'
import { useProjectStore } from './stores/project-store'
import { useUIStore, ACTIVE_NARRATIVE_STORAGE_KEY } from './stores/ui-store'
import { usePlayStore } from './stores/play-store'
import { useAssetStore } from './stores/asset-store'
import Toolbar from './components/toolbar/Toolbar'
import ExplorerSidebar from './components/explorer/ExplorerSidebar'
import NarrativeCanvas from './components/canvas/NarrativeCanvas'
import InspectorPanel from './components/inspector/InspectorPanel'
import PlayMode from './components/play/PlayMode'
import AssetManagerModal from './components/asset-manager/AssetManagerModal'

export default function App() {
  const isHydrated = useRef(false)
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const setActiveNarrative = useUIStore((s) => s.setActiveNarrative)
  const inspectorOpen = useUIStore((s) => s.inspectorOpen)
  const toggleInspector = useUIStore((s) => s.toggleInspector)
  const isPlayActive = usePlayStore((s) => s.isActive)
  const assetManagerOpen = useUIStore((s) => s.assetManagerOpen)
  const assetManagerMode = useUIStore((s) => s.assetManagerMode)
  const assetManagerInsertCallback = useUIStore((s) => s.assetManagerInsertCallback)
  const closeAssetManager = useUIStore((s) => s.closeAssetManager)
  const [storageWarning, setStorageWarning] = useState(false)

  // Hydrate stores from Dexie on app mount
  useEffect(() => {
    if (isHydrated.current) return
    isHydrated.current = true

    Promise.all([
      db.narratives.toArray(),
      db.nodes.toArray(),
      db.connections.toArray(),
      db.components.toArray(),
      db.variations.toArray(),
      db.assets.toArray()
    ]).then(([narratives, nodes, connections, components, variations, assets]) => {
      const narrativeMap = Object.fromEntries(narratives.map((n) => [n.id, n]))
      const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))
      const connectionMap = Object.fromEntries(connections.map((c) => [c.id, c]))
      const componentMap = Object.fromEntries(components.map((c) => [c.id, c]))
      const variationMap = Object.fromEntries(variations.map((v) => [v.id, v]))
      const assetMap = Object.fromEntries(assets.map((a) => [a.id, a]))

      useProjectStore.setState({
        narratives: narrativeMap,
        nodes: nodeMap,
        connections: connectionMap,
        components: componentMap,
        variations: variationMap
      })
      useAssetStore.setState({ assets: assetMap })

      // Ensure at least one narrative exists
      const store = useProjectStore.getState()
      const allNarratives = Object.values(narrativeMap)

      let activeId = localStorage.getItem(ACTIVE_NARRATIVE_STORAGE_KEY)

      if (allNarratives.length === 0) {
        const defaultNarrative = store.ensureDefaultNarrative()
        activeId = defaultNarrative.id
      } else if (!activeId || !narrativeMap[activeId]) {
        const sorted = [...allNarratives].sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0))
        activeId = sorted[0]?.id ?? null
      }

      if (activeId) {
        setActiveNarrative(activeId)
      }
    }).catch(console.error)
  }, [setActiveNarrative])

  // Storage warning listener
  useEffect(() => {
    const handler = () => setStorageWarning(true)
    window.addEventListener('narrativeflow:storage-warning', handler)
    return () => window.removeEventListener('narrativeflow:storage-warning', handler)
  }, [])

  // Undo/redo keyboard shortcuts (T048)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      if (isEditing) return

      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrl = isMac ? e.metaKey : e.ctrlKey

      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        useProjectStore.temporal.getState().undo()
      } else if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        useProjectStore.temporal.getState().redo()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Toolbar />

      {storageWarning && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-950 border-b border-amber-700 text-xs text-amber-300 shrink-0">
          <span>⚠ Storage almost full. Consider exporting your work.</span>
          <button
            onClick={() => setStorageWarning(false)}
            className="text-amber-500 hover:text-amber-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <ExplorerSidebar />
        
        <main className="flex-1 relative overflow-hidden">
          {activeNarrativeId ? (
            <NarrativeCanvas key={activeNarrativeId} narrativeId={activeNarrativeId} />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              Loading…
            </div>
          )}
        </main>

        {/* Inspector panel — slides in from right */}
        {inspectorOpen && (
          <aside className="w-72 shrink-0 bg-zinc-950 border-l border-zinc-800 overflow-y-auto flex flex-col">
            <InspectorPanel />
          </aside>
        )}

        {/* Right tray toggle tab */}
        <button
          onClick={toggleInspector}
          title={inspectorOpen ? 'Close inspector' : 'Open inspector'}
          style={{
            position: 'absolute',
            right: inspectorOpen ? '288px' : '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'right 0.15s ease',
            zIndex: 10
          }}
          className="flex items-center justify-center w-5 h-14 bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-md hover:bg-zinc-700 transition-colors"
        >
          <span className="text-zinc-400 text-xs select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {inspectorOpen ? '›' : '‹'}
          </span>
        </button>
      </div>

      {isPlayActive && <PlayMode />}

      {assetManagerOpen && (
        <AssetManagerModal
          mode={assetManagerMode}
          onClose={closeAssetManager}
          {...(assetManagerInsertCallback ? { onSelect: assetManagerInsertCallback } : {})}
        />
      )}
    </div>
  )
}
