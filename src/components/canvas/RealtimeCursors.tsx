/**
 * Realtime collaboration overlay components for NarrativeCanvas.
 *
 * CursorTracker  — null-rendering component that reads mouse position and
 *                  sends it to the other peer(s) over WebRTC. Must be rendered
 *                  inside ReactFlowProvider so it can call useReactFlow().
 *
 * RemoteCursors  — renders incoming cursor positions as MousePointer2 icons.
 *                  Isolated with memo so that high-frequency updates (viewport
 *                  transform changes + cursor messages) never re-render the
 *                  heavyweight NarrativeCanvasInner.
 */

import { useEffect, useRef, memo } from 'react'
import { useReactFlow, useStore as useRFStore } from '@xyflow/react'
import { MousePointer2 } from 'lucide-react'
import { useRealtimeStore, CURSOR_COLORS } from '../../stores/realtime-store'
import type { EntityId } from '../../lib/types'

// ── CursorTracker ─────────────────────────────────────────────────────────────

interface CursorTrackerProps {
  narrativeId: EntityId
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function CursorTracker({ narrativeId, containerRef }: CursorTrackerProps) {
  const { screenToFlowPosition } = useReactFlow()
  const realtimeMode = useRealtimeStore((s) => s.mode)
  const sendCursor = useRealtimeStore((s) => s.sendCursor)

  const cursorSendTimeRef = useRef<number>(0)

  // Stable refs — the native listener is created once per mode change and
  // reads these refs to always use up-to-date values without being recreated.
  const narrativeIdRef = useRef(narrativeId)
  useEffect(() => {
    narrativeIdRef.current = narrativeId
  }, [narrativeId])

  const sendCursorRef = useRef(sendCursor)
  useEffect(() => {
    sendCursorRef.current = sendCursor
  }, [sendCursor])

  const screenToFlowPositionRef = useRef(screenToFlowPosition)
  useEffect(() => {
    screenToFlowPositionRef.current = screenToFlowPosition
  }, [screenToFlowPosition])

  // Report the active narrative immediately on navigation so the host's
  // sidebar indicator updates even before the user moves the mouse.
  useEffect(() => {
    if (realtimeMode === 'standalone') return
    sendCursor(narrativeId, 0, 0)
  }, [narrativeId, realtimeMode, sendCursor])

  // Native passive listener — avoids React synthetic-event overhead on every
  // mousemove frame, which can desync the wheel-based pan timing in ReactFlow.
  useEffect(() => {
    const container = containerRef.current
    if (!container || realtimeMode === 'standalone') return

    const handler = (e: MouseEvent) => {
      const now = Date.now()
      if (now - cursorSendTimeRef.current < 50) return
      cursorSendTimeRef.current = now
      const pos = screenToFlowPositionRef.current({ x: e.clientX, y: e.clientY })
      sendCursorRef.current(narrativeIdRef.current, pos.x, pos.y)
    }

    container.addEventListener('mousemove', handler, { passive: true })
    return () => container.removeEventListener('mousemove', handler)
  }, [realtimeMode, containerRef])

  return null
}

// ── RemoteCursors ─────────────────────────────────────────────────────────────

interface RemoteCursorsProps {
  narrativeId: EntityId
}

export const RemoteCursors = memo(function RemoteCursors({ narrativeId }: RemoteCursorsProps) {
  const mode = useRealtimeStore((s) => s.mode)
  const clientCursors = useRealtimeStore((s) => s.clientCursors)
  const hostCursor = useRealtimeStore((s) => s.hostCursor)
  const [tx, ty, zoom] = useRFStore((s) => s.transform)

  if (mode === 'host') {
    return (
      <>
        {Object.entries(clientCursors).map(([idxStr, cursor]) => {
          if (cursor.narrativeId !== narrativeId) return null
          const color = CURSOR_COLORS[parseInt(idxStr) % CURSOR_COLORS.length]
          return (
            <div
              key={idxStr}
              style={{
                position: 'absolute',
                left: cursor.x * zoom + tx,
                top: cursor.y * zoom + ty,
                pointerEvents: 'none',
                zIndex: 10,
                color,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                transform: 'translate(-2px, -2px)',
                transition: 'left 0.05s ease-in, top 0.05S ease-in'
              }}
            >
              <MousePointer2 size={20} fill={color} strokeWidth={1.5} />
            </div>
          )
        })}
      </>
    )
  }

  // Clients are planned to see the cursor of other clients in the future
  if (mode === 'client' && hostCursor && hostCursor.narrativeId === narrativeId) {
    const color = '#cdd6f4'
    return (
      <div
        style={{
          position: 'absolute',
          left: hostCursor.x * zoom + tx,
          top: hostCursor.y * zoom + ty,
          pointerEvents: 'none',
          zIndex: 10,
          color,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
          transition: 'left 0.05s ease-in, top 0.05s ease-in',
          transform: 'translate(-2px, -2px)'
        }}
      >
        <MousePointer2 size={20} fill={color} strokeWidth={1.5} />
      </div>
    )
  }

  return null
})
