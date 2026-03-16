import { ManualSignalingAdapter, type SignalingAdapter } from './signaling'
import type { SyncMessage } from './types'

// ── ICE servers ───────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS })
}

// ── Shared data-channel wiring ────────────────────────────────────────────────

function wireChannel(
  channel: RTCDataChannel,
  callbacks: {
    onOpen: () => void
    onMessage: (msg: SyncMessage) => void
  }
): void {
  channel.onopen = callbacks.onOpen
  channel.onmessage = (e) => {
    try {
      callbacks.onMessage(JSON.parse(e.data as string) as SyncMessage)
    } catch {
      // Ignore malformed frames
    }
  }
}

// ── HostPeer ──────────────────────────────────────────────────────────────────

/**
 * Manages the host side of a WebRTC session.
 *
 * Lifecycle:
 *   1. `generateOffer()` — creates the data channel, generates the SDP offer,
 *      and waits for ICE gathering. Returns the RTCSessionDescriptionInit
 *      object; the store wraps it with idx and encodes once.
 *   2. `acceptAnswer(sdp)` — applies the client's raw SDP answer; ICE begins.
 *   3. `onConnected` fires when the data channel opens (session is live).
 */
export class HostPeer {
  private readonly pc: RTCPeerConnection
  private channel: RTCDataChannel | null = null
  private readonly signaling: SignalingAdapter

  onConnected: (() => void) | null = null
  onDisconnected: (() => void) | null = null
  onMessage: ((msg: SyncMessage) => void) | null = null

  constructor(signaling: SignalingAdapter = new ManualSignalingAdapter()) {
    this.signaling = signaling
    this.pc = createPeerConnection()

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState
      if (state === 'failed' || state === 'closed') {
        this.onDisconnected?.()
      }
    }
  }

  async generateOffer(): Promise<RTCSessionDescriptionInit> {
    // Create data channel BEFORE generating the offer so that the SDP
    // includes the data channel negotiation.
    this.channel = this.pc.createDataChannel('sync', { ordered: true })

    wireChannel(this.channel, {
      onOpen: () => this.onConnected?.(),
      onMessage: (msg) => this.onMessage?.(msg)
    })

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    return this.signaling.getLocalDescription(this.pc)
  }

  async acceptAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
  }

  send(msg: SyncMessage): void {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(msg))
    }
  }

  destroy(): void {
    this.channel?.close()
    this.pc.close()
    this.onConnected = null
    this.onDisconnected = null
    this.onMessage = null
  }
}

// ── ClientPeer ────────────────────────────────────────────────────────────────

/**
 * Manages the client side of a WebRTC session.
 *
 * Lifecycle:
 *   1. `receiveOffer(sdp)` — applies the host's raw SDP offer, creates an
 *      answer, and waits for ICE gathering. Returns the RTCSessionDescriptionInit
 *      answer; the store wraps it with idx and encodes once.
 *   2. `onConnected` fires when the data channel opens (session is live).
 */
export class ClientPeer {
  private readonly pc: RTCPeerConnection
  private channel: RTCDataChannel | null = null
  private readonly signaling: SignalingAdapter

  onConnected: (() => void) | null = null
  onDisconnected: (() => void) | null = null
  onMessage: ((msg: SyncMessage) => void) | null = null

  constructor(signaling: SignalingAdapter = new ManualSignalingAdapter()) {
    this.signaling = signaling
    this.pc = createPeerConnection()

    // The host created the data channel, so the client receives it here.
    this.pc.ondatachannel = (e) => {
      this.channel = e.channel
      wireChannel(this.channel, {
        onOpen: () => this.onConnected?.(),
        onMessage: (msg) => this.onMessage?.(msg)
      })
    }

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState
      if (state === 'failed' || state === 'closed') {
        this.onDisconnected?.()
      }
    }
  }

  async receiveOffer(sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    return this.signaling.getLocalDescription(this.pc)
  }

  send(msg: SyncMessage): void {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(msg))
    }
  }

  destroy(): void {
    this.channel?.close()
    this.pc.close()
    this.onConnected = null
    this.onDisconnected = null
    this.onMessage = null
  }
}
