import { useEffect, useRef, useState } from 'react'
import { db } from './lib/db'
import { useProjectStore } from './stores/project-store'
import { useUIStore, ACTIVE_NARRATIVE_STORAGE_KEY } from './stores/ui-store'
import { usePlayStore } from './stores/play-store'
import { useAssetStore } from './stores/asset-store'
import { useRealtimeStore, getOfferFromUrl } from './stores/realtime-store'
import Toolbar from './components/toolbar/Toolbar'
import ExplorerSidebar from './components/explorer/ExplorerSidebar'
import NarrativeCanvas from './components/canvas/NarrativeCanvas'
import InspectorPanel from './components/inspector/InspectorPanel'
import PlayMode from './components/play/PlayMode'
import { PortalProvider } from './components/layout/PortalProvider'
import { ModalContainer } from './components/layout/ModalContainer'
import { ToastContainer } from './components/layout/ToastContainer'
import { MobileUnsupportedOverlay } from './components/layout/MobileUnsupported'
import ClientJoinScreen from './components/realtime/ClientJoinScreen'
import { FeedbackProvider } from './components/feedback/FeedbackProvider'
import { ContextMenuContainer } from './components/layout/ContextMenuContainer'

const IS_CLIENT_MODE = Boolean(getOfferFromUrl())

export default function App() {
  const isHydrated = useRef(false)
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const setActiveNarrative = useUIStore((s) => s.setActiveNarrative)
  const inspectorOpen = useUIStore((s) => s.inspectorOpen)
  const toggleInspector = useUIStore((s) => s.toggleInspector)
  const isPlayActive = usePlayStore((s) => s.isActive)
  const realtimeStatus = useRealtimeStore((s) => s.clientStatus)
  const [storageWarning, setStorageWarning] = useState(false)

  // In client mode we never hydrate from IndexedDB — project state comes from
  // the host via the data channel once the WebRTC connection is established.
  const showClientScreen = IS_CLIENT_MODE && realtimeStatus !== 'connected'

  // Hydrate stores from Dexie on app mount (skipped in client mode)
  useEffect(() => {
    if (IS_CLIENT_MODE) return
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
      useProjectStore.temporal.getState().clear()
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
    window.addEventListener('fabletoria:storage-warning', handler)
    return () => window.removeEventListener('fabletoria:storage-warning', handler)
  }, [])

  // Undo/redo keyboard shortcuts
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
    <PortalProvider>
      <MobileUnsupportedOverlay />
      <div className="flex flex-col h-screen bg-bg-main text-text-main overflow-hidden">
        <FeedbackProvider/>
        <Toolbar />

        {storageWarning && (
          <div className="flex items-center justify-between px-tk-4 py-tk-2 bg-status-warning/20 border-b border-status-warning/40 text-tk-xs text-status-warning shrink-0">
            <span>Storage almost full. Consider exporting your work.</span>
            <button
              onClick={() => setStorageWarning(false)}
              className="text-status-warning hover:text-white"
            >
              X
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden relative">
          <ExplorerSidebar />

          <main className="flex-1 relative overflow-hidden">
            {activeNarrativeId ? (
              <NarrativeCanvas key={activeNarrativeId} narrativeId={activeNarrativeId} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-dim">
                Create or select a narrative to begin
              </div>
            )}
          </main>

          {/* Inspector panel */}
          {inspectorOpen && (
            <aside className="w-72 shrink-0 bg-bg-main border-l border-border-main overflow-y-auto flex flex-col">
              <InspectorPanel />
            </aside>
          )}

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
            className="flex items-center justify-center w-5 h-14 bg-bg-surface border border-border-main border-r-0 rounded-l-tk-md hover:bg-bg-header transition-colors"
          >
            <span
              className="text-text-dim text-tk-xs select-none"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {inspectorOpen ? '›' : '‹'}
            </span>
          </button>
        </div>

        {isPlayActive && <PlayMode />}

        <ModalContainer />
        <ToastContainer />
        <ContextMenuContainer />

        {showClientScreen && <ClientJoinScreen />}
      </div>
    </PortalProvider>
  )
}
