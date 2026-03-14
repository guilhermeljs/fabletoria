import type {
  NarrativeMap,
  StoryNodeMap,
  ConnectionMap,
  ComponentMap,
  VariationMap,
} from '../types'

// ── Project snapshot ──────────────────────────────────────────────────────────

export interface ProjectSnapshot {
  narratives: NarrativeMap
  nodes: StoryNodeMap
  connections: ConnectionMap
  components: ComponentMap
  variations: VariationMap
}

// ── Data channel message protocol ─────────────────────────────────────────────

export type SyncMessage =
  /** Client → Host: signals the data channel is open and ready */
  | { type: 'ready' }
  /** Bidirectional: full project state snapshot */
  | { type: 'snapshot'; payload: ProjectSnapshot }
  /** Client → Host: real-time mouse cursor position in flow coordinates */
  | { type: 'cursor'; narrativeId: string; x: number; y: number }

// ── Connection state ──────────────────────────────────────────────────────────

/**
 * Tracks the lifecycle of a WebRTC session from both the host and client
 * perspectives. The values are intentionally generic so they remain correct
 * regardless of the signaling mechanism used.
 *
 * State machine:
 *   idle → preparing → waiting-answer → connecting → connected
 *                                                  ↘ failed
 *   connected → disconnected
 */
export type ConnectionStatus =
  | 'idle'           // No active session
  | 'preparing'      // Host: generating offer | Client: processing offer & creating answer
  | 'waiting-answer' // Host: answer code input shown | Client: answer shown, waiting for host
  | 'connecting'     // ICE negotiation in progress
  | 'connected'      // Data channel open, syncing live
  | 'failed'         // Unrecoverable error
  | 'disconnected'   // Was connected, peer went away

// ── App mode ──────────────────────────────────────────────────────────────────

export type AppMode =
  | 'standalone' // Normal offline mode
  | 'host'       // Sharing the project via WebRTC
  | 'client'     // Viewing a hosted project via WebRTC (read-only DB)

// ── Invite (host side) ────────────────────────────────────────────────────────

/**
 * Per-invite connection lifecycle on the host side.
 * Each invite corresponds to one HostPeer and one potential client.
 */
export type InviteStatus =
  | 'preparing'      // Generating the offer
  | 'waiting-answer' // Offer ready; waiting for client's answer code
  | 'connecting'     // Answer accepted; ICE negotiation in progress
  | 'connected'      // Data channel open; client is live
  | 'failed'         // Unrecoverable error
  | 'disconnected'   // Was connected, client went away

export interface InviteEntry {
  /** Monotonically-increasing index encoded into both the offer link and answer code. */
  idx: number
  status: InviteStatus
  /** The full URL the host must send to the client. */
  shareLink: string
}

// ── Wrapped signaling payloads ────────────────────────────────────────────────

/**
 * Payload embedded in both the offer URL param and the answer code.
 * Carrying `idx` in both directions lets the host route answers to the correct peer
 * without a separate field in the UI.
 */
export interface WrappedSdp {
  /** Raw RTCSessionDescriptionInit — encoded once alongside idx, not separately. */
  sdp: RTCSessionDescriptionInit
  /** Invite index; used by the host to route to the correct HostPeer */
  idx: number
}
