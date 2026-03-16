/**
 * Project state synchronization over a WebRTC data channel.
 *
 * Strategy: full-snapshot sync (simpler and correct for small projects).
 * Both peers subscribe to the project store; on change they debounce and send
 * the full snapshot to the other side. When a snapshot arrives it is applied
 * without triggering another broadcast (loop-prevention flag).
 *
 * Migration path to delta/mutation sync: replace `extractSnapshot` and
 * `applySnapshot` with serialised store mutations; the rest of this module
 * stays unchanged.
 */

import { useProjectStore } from '../../stores/project-store'
import type { HostPeer } from './peer'
import type { ClientPeer } from './peer'
import type { ProjectSnapshot } from './types'

// ── Snapshot helpers ──────────────────────────────────────────────────────────

function extractSnapshot(): ProjectSnapshot {
  const { narratives, nodes, connections, components, variations } = useProjectStore.getState()
  return { narratives, nodes, connections, components, variations }
}

function applySnapshot(snapshot: ProjectSnapshot): void {
  useProjectStore.setState(
    {
      narratives: snapshot.narratives,
      nodes: snapshot.nodes,
      connections: snapshot.connections,
      components: snapshot.components,
      variations: snapshot.variations
    },
    false
  )
  // Clear undo history so the client doesn't "undo" to host state
  useProjectStore.temporal.getState().clear()
}

// ── Loop-prevention flag ──────────────────────────────────────────────────────

// Shared across host and client since only one session runs at a time.
let _applyingRemoteSnapshot = false

// ── Debounced broadcaster ─────────────────────────────────────────────────────

function makeDebounced(
  send: (snapshot: ProjectSnapshot) => void,
  delayMs = 80
): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    trigger() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        send(extractSnapshot())
      }, delayMs)
    },
    cancel() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }
}

// ── Host sync ─────────────────────────────────────────────────────────────────

/**
 * Called once the host's data channel is open.
 * Returns a cleanup function to call on disconnect or stop-sharing.
 *
 * @param broadcastToOthers - called with the incoming snapshot so the host can
 *   relay it to every other connected client (star-topology broadcast).
 * @param onCursor - called when the client sends a cursor position update.
 */
export function setupHostSync(
  peer: HostPeer,
  options: {
    broadcastToOthers: (snapshot: ProjectSnapshot) => void
    onCursor?: (cursor: { narrativeId: string; x: number; y: number }) => void
  }
): () => void {
  const { broadcastToOthers, onCursor } = options

  const debounced = makeDebounced((snapshot) => peer.send({ type: 'snapshot', payload: snapshot }))

  // Handle incoming messages from the client
  peer.onMessage = (msg) => {
    if (msg.type === 'ready') {
      // Client signalled it is ready — send the initial project state
      peer.send({ type: 'snapshot', payload: extractSnapshot() })
    } else if (msg.type === 'snapshot') {
      // Client sent an edit; apply it (host saves to DB normally)
      _applyingRemoteSnapshot = true
      applySnapshot(msg.payload)
      _applyingRemoteSnapshot = false
      // Relay the edit to every other connected client
      broadcastToOthers(msg.payload)
    } else if (msg.type === 'cursor') {
      onCursor?.({ narrativeId: msg.narrativeId, x: msg.x, y: msg.y })
    }
  }

  // Broadcast host-side edits to the client
  const unsubscribe = useProjectStore.subscribe(() => {
    if (_applyingRemoteSnapshot) return
    debounced.trigger()
  })

  return () => {
    unsubscribe()
    debounced.cancel()
    peer.onMessage = null
  }
}

// ── Client sync ───────────────────────────────────────────────────────────────

/**
 * Called once the client's data channel is open.
 * Returns a cleanup function to call on disconnect.
 *
 * @param onCursor - called when the host sends a cursor position update.
 */
export function setupClientSync(
  peer: ClientPeer,
  options?: {
    onCursor?: (cursor: { narrativeId: string; x: number; y: number }) => void
  }
): () => void {
  const { onCursor } = options ?? {}

  const debounced = makeDebounced((snapshot) => peer.send({ type: 'snapshot', payload: snapshot }))

  // Handle incoming messages from the host
  peer.onMessage = (msg) => {
    if (msg.type === 'snapshot') {
      _applyingRemoteSnapshot = true
      applySnapshot(msg.payload)
      _applyingRemoteSnapshot = false
    } else if (msg.type === 'cursor') {
      onCursor?.({ narrativeId: msg.narrativeId, x: msg.x, y: msg.y })
    }
  }

  // Notify host that we are ready to receive the initial state
  peer.send({ type: 'ready' })

  // Broadcast client-side edits to the host
  const unsubscribe = useProjectStore.subscribe(() => {
    if (_applyingRemoteSnapshot) return
    debounced.trigger()
  })

  return () => {
    unsubscribe()
    debounced.cancel()
    peer.onMessage = null
  }
}
