/**
 * SignalingAdapter abstracts the mechanism used to exchange WebRTC session
 * descriptions between peers.
 *
 * The adapter is responsible only for:
 *   1. Waiting for ICE gathering to complete.
 *   2. Returning the finalized RTCSessionDescriptionInit object.
 *
 * Encoding/decoding and wrapping with the invite index (WrappedSdp) is handled
 * by the store layer so it can be done in a single base64 pass.
 *
 * Future migration path: implement ServerSignalingAdapter that sends/receives
 * descriptions via WebSocket and swap it in — no other layer changes.
 */
export interface SignalingAdapter {
  /**
   * Wait for ICE gathering to complete and return the finalized local
   * RTCSessionDescriptionInit. The caller handles encoding.
   */
  getLocalDescription(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit>
}

// ── Base64url helpers (used by the store) ─────────────────────────────────────

/**
 * URL-safe base64 encoding that handles non-ASCII characters.
 * Safe to embed directly in a URL query parameter.
 */
export function encodeBase64Url(value: unknown): string {
  const json = JSON.stringify(value)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeBase64Url(encoded: string): unknown {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const rem = b64.length % 4
  if (rem) b64 += '='.repeat(4 - rem)
  return JSON.parse(decodeURIComponent(escape(atob(b64))))
}

// ── ICE gathering ─────────────────────────────────────────────────────────────

const ICE_GATHERING_TIMEOUT_MS = 6_000

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', handler)
      resolve() // proceed with whatever candidates gathered so far
    }, ICE_GATHERING_TIMEOUT_MS)

    const handler = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout)
        pc.removeEventListener('icegatheringstatechange', handler)
        resolve()
      }
    }

    pc.addEventListener('icegatheringstatechange', handler)
  })
}

// ── Manual (copy-paste) implementation ───────────────────────────────────────

/**
 * Returns the local SDP description object after ICE gathering.
 * The store wraps it with the invite index and encodes everything once.
 */
export class ManualSignalingAdapter implements SignalingAdapter {
  async getLocalDescription(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    await waitForIceGathering(pc)
    return pc.localDescription!.toJSON() as RTCSessionDescriptionInit
  }
}
