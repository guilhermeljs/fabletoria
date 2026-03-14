import { create } from 'zustand'
import { HostPeer } from '../lib/webrtc/peer'
import { ClientPeer } from '../lib/webrtc/peer'
import { setupHostSync, setupClientSync } from '../lib/webrtc/sync'
import { encodeBase64Url, decodeBase64Url } from '../lib/webrtc/signaling'
import { disableProjectStorePersistence } from './project-store'
import type { AppMode, ConnectionStatus, InviteEntry, InviteStatus, WrappedSdp } from '../lib/webrtc/types'

// ── Module-level peer storage ─────────────────────────────────────────────────
//
// HostPeer instances are NOT stored in Zustand state because they are mutable
// objects with callbacks — putting them in Zustand would cause stale-closure
// issues. The store holds only plain serialisable InviteEntry descriptors.

const _hostPeers = new Map<number, HostPeer>()
const _hostCleanups = new Map<number, () => void>()
let _nextInviteIdx = 0

let _clientCleanup: (() => void) | null = null
let _clientPeer: ClientPeer | null = null

// ── Cursor colors (one per connected client slot, cycling) ────────────────────

export const CURSOR_COLORS = [
  '#89b4fa', // blue
  '#a6e3a1', // green
  '#fab387', // peach
  '#f38ba8', // red
  '#cba6f7', // mauve
  '#f9e2af', // yellow
]

// ── URL helpers ───────────────────────────────────────────────────────────────

export function getOfferFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('offer')
}

function buildShareLink(wrappedOffer: string): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('offer', wrappedOffer)
  return url.toString()
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidWrappedSdp(v: unknown): v is WrappedSdp {
  if (typeof v !== 'object' || v === null) return false
  const w = v as WrappedSdp
  return (
    typeof w.idx === 'number' &&
    Number.isInteger(w.idx) &&
    w.idx >= 0 &&
    typeof w.sdp === 'object' &&
    w.sdp !== null &&
    typeof (w.sdp as RTCSessionDescriptionInit).type === 'string' &&
    typeof (w.sdp as RTCSessionDescriptionInit).sdp === 'string'
  )
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface RealtimeState {
  mode: AppMode

  // ── Host state ─────────────────────────────────────────────────────────────
  invites: InviteEntry[]
  answerError: string | null

  // ── Client state ───────────────────────────────────────────────────────────
  clientStatus: ConnectionStatus
  answerCode: string | null
  clientError: string | null

  // ── Cursor state (host only) ────────────────────────────────────────────────
  /** Maps invite idx → latest cursor position reported by that client. */
  clientCursors: Record<number, { narrativeId: string; x: number; y: number }>
  /** Latest cursor position broadcast by the host (client-only). */
  hostCursor: { narrativeId: string; x: number; y: number } | null

  // ── Host actions ────────────────────────────────────────────────────────────
  /**
   * Creates a new HostPeer, generates an offer, encodes it with the invite
   * index, and appends an InviteEntry to the list.
   */
  addInvite: () => Promise<void>

  /**
   * Decodes the wrapped answer, validates the invite index, and routes the raw
   * SDP answer to the correct HostPeer.
   */
  acceptAnswer: (wrappedAnswer: string) => Promise<void>

  /** Tears down all host sessions and resets to standalone mode. */
  stopSharing: () => void

  // ── Client actions ──────────────────────────────────────────────────────────
  /**
   * Decodes the wrapped offer (containing idx), processes it, and returns
   * the wrapped answer code the client must send back to the host.
   */
  joinAsClient: (wrappedOffer: string) => Promise<string>

  /** Client → Host: sends the current mouse position in flow coordinates. */
  sendCursor: (narrativeId: string, x: number, y: number) => void
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function updateInvite(
  set: (fn: (s: RealtimeState) => Partial<RealtimeState>) => void,
  idx: number,
  status: InviteStatus
): void {
  set((s) => ({
    invites: s.invites.map((inv) => (inv.idx === idx ? { ...inv, status } : inv)),
  }))
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  mode: 'standalone',
  invites: [],
  answerError: null,
  clientStatus: 'idle',
  answerCode: null,
  clientError: null,
  clientCursors: {},
  hostCursor: null,

  // ── Host ──────────────────────────────────────────────────────────────────

  async addInvite() {
    const idx = _nextInviteIdx++
    set((s) => ({ mode: 'host', invites: [...s.invites, { idx, status: 'preparing', shareLink: '' }] }))

    const peer = new HostPeer()
    _hostPeers.set(idx, peer)

    peer.onConnected = () => {
      const cleanup = setupHostSync(peer, {
        broadcastToOthers: (snapshot) => {
          for (const [otherIdx, otherPeer] of _hostPeers.entries()) {
            if (otherIdx !== idx) {
              otherPeer.send({ type: 'snapshot', payload: snapshot })
            }
          }
        },
        onCursor: (cursor) => {
          set((s) => ({ clientCursors: { ...s.clientCursors, [idx]: cursor } }))
        },
      })
      _hostCleanups.set(idx, cleanup)
      updateInvite(set, idx, 'connected')
    }

    peer.onDisconnected = () => {
      _hostCleanups.get(idx)?.()
      _hostCleanups.delete(idx)
      updateInvite(set, idx, 'disconnected')
      set((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [idx]: _removed, ...rest } = s.clientCursors
        return { clientCursors: rest as typeof s.clientCursors }
      })
    }

    try {
      const sdp = await peer.generateOffer()

      // Wrap SDP + idx into a single JSON object and encode once
      const wrappedOffer = encodeBase64Url({ sdp, idx } satisfies WrappedSdp)
      const shareLink = buildShareLink(wrappedOffer)

      set((s) => ({
        invites: s.invites.map((inv) =>
          inv.idx === idx ? { ...inv, status: 'waiting-answer', shareLink } : inv
        ),
      }))
    } catch (err) {
      peer.destroy()
      _hostPeers.delete(idx)
      set((s) => ({
        invites: s.invites.map((inv) =>
          inv.idx === idx ? { ...inv, status: 'failed' } : inv
        ),
        answerError:
          err instanceof Error ? err.message : 'Falha ao gerar o convite.',
      }))
    }
  },

  async acceptAnswer(wrappedAnswer) {
    set({ answerError: null })

    // ── 1. Decode ────────────────────────────────────────────────────────────
    let decoded: unknown
    try {
      decoded = decodeBase64Url(wrappedAnswer.trim())
    } catch {
      set({ answerError: 'Código inválido.' })
      return
    }

    if (!isValidWrappedSdp(decoded)) {
      set({ answerError: 'Código inválido.' })
      return
    }

    const { sdp: answerSdp, idx } = decoded

    // ── 2. Validate invite index ──────────────────────────────────────────────
    const invite = get().invites.find((i) => i.idx === idx)

    if (!invite) {
      set({ answerError: 'Código inválido: índice de convite não encontrado.' })
      return
    }

    if (invite.status === 'connected') {
      set({ answerError: 'Este convite já está em uso por um cliente conectado.' })
      return
    }

    if (invite.status === 'connecting') {
      set({ answerError: 'Este convite já está sendo estabelecido. Aguarde.' })
      return
    }

    if (invite.status === 'failed' || invite.status === 'disconnected') {
      set({ answerError: 'Este convite expirou. Gere um novo convite.' })
      return
    }

    if (invite.status === 'preparing') {
      set({ answerError: 'O convite ainda está sendo preparado. Tente novamente em instantes.' })
      return
    }

    // ── 3. Route to the correct peer ─────────────────────────────────────────
    const peer = _hostPeers.get(idx)
    if (!peer) {
      set({ answerError: 'Código inválido.' })
      return
    }

    updateInvite(set, idx, 'connecting')

    try {
      await peer.acceptAnswer(answerSdp)
      // ICE proceeds automatically; peer.onConnected handles the rest
    } catch {
      updateInvite(set, idx, 'failed')
      set({ answerError: 'Código inválido. Verifique e tente novamente.' })
    }
  },

  stopSharing() {
    // Tear down all host peers
    for (const cleanup of _hostCleanups.values()) cleanup()
    for (const peer of _hostPeers.values()) peer.destroy()
    _hostPeers.clear()
    _hostCleanups.clear()
    _nextInviteIdx = 0

    set({
      mode: 'standalone',
      invites: [],
      answerError: null,
      clientCursors: {},
    })
  },

  // ── Client ────────────────────────────────────────────────────────────────

  async joinAsClient(wrappedOffer) {
    set({ mode: 'client', clientStatus: 'preparing', clientError: null })

    // ── Decode the wrapped offer ──────────────────────────────────────────────
    let decoded: unknown
    try {
      decoded = decodeBase64Url(wrappedOffer)
    } catch {
      set({
        mode: 'standalone',
        clientStatus: 'failed',
        clientError: 'Link inválido: não foi possível decodificar o convite.',
      })
      throw new Error('Invalid offer encoding')
    }

    if (!isValidWrappedSdp(decoded)) {
      set({
        mode: 'standalone',
        clientStatus: 'failed',
        clientError: 'Link inválido: formato de convite não reconhecido.',
      })
      throw new Error('Invalid offer format')
    }

    const { sdp: offerSdp, idx } = decoded

    // ── Process the offer and generate the answer ─────────────────────────────
    const peer = new ClientPeer()
    _clientPeer = peer

    peer.onConnected = () => {
      disableProjectStorePersistence()
      _clientCleanup = setupClientSync(peer, {
        onCursor: (cursor) => set({ hostCursor: cursor }),
      })
      set({ clientStatus: 'connected' })
    }

    peer.onDisconnected = () => {
      // While in 'waiting-answer' the host hasn't accepted yet, so ICE times
      // out on the client side — this is expected and not a real failure.
      // Ignore the event; the connection will proceed once the host accepts.
      if (get().clientStatus === 'waiting-answer') return

      _clientCleanup?.()
      _clientCleanup = null
      _clientPeer = null
      set({ clientStatus: 'disconnected', hostCursor: null })
    }

    try {
      const answerSdp = await peer.receiveOffer(offerSdp)

      // Wrap SDP + idx into a single JSON object and encode once
      const answerCode = encodeBase64Url({ sdp: answerSdp, idx } satisfies WrappedSdp)

      set({ answerCode, clientStatus: 'waiting-answer' })
      return answerCode
    } catch (err) {
      peer.destroy()
      _clientPeer = null
      const message = err instanceof Error ? err.message : 'Falha ao processar o convite.'
      set({ mode: 'standalone', clientStatus: 'failed', clientError: message })
      throw err
    }
  },

  sendCursor(narrativeId, x, y) {
    const { mode } = get()
    if (mode === 'client') {
      _clientPeer?.send({ type: 'cursor', narrativeId, x, y })
    } else if (mode === 'host') {
      for (const peer of _hostPeers.values()) {
        peer.send({ type: 'cursor', narrativeId, x, y })
      }
    }
  },
}))

// ── Convenience selectors ─────────────────────────────────────────────────────

export function isClientMode(): boolean {
  return useRealtimeStore.getState().mode === 'client'
}
