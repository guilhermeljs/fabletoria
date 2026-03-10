import { useMcpStore } from '../stores/mcp-store'

interface ElectronAPIWithMcp {
  isElectron: boolean
  mcp: {
    start: () => Promise<{ ok: true; port: number; url: string } | { ok: false; error: string; message: string }>
    stop: () => Promise<{ ok: true }>
    status: () => Promise<{ running: boolean; port: number | null; url: string | null }>
  }
}

function getMcpAPI(): ElectronAPIWithMcp['mcp'] | null {
  const api = (window as unknown as { electronAPI?: ElectronAPIWithMcp })['electronAPI']
  return api?.mcp ?? null
}

export function useMcp() {
  const store = useMcpStore()
  const mcpAPI = getMcpAPI()

  async function start() {
    if (!mcpAPI) return
    store.setStarting()
    const result = await mcpAPI.start()
    if (result.ok) {
      store.setRunning(result.port, result.url)
    } else {
      store.setError(result.message)
    }
  }

  async function stop() {
    if (!mcpAPI) return
    store.setStopping()
    await mcpAPI.stop()
    store.setStopped()
  }

  return {
    status: store.status,
    port: store.port,
    url: store.url,
    error: store.error,
    start,
    stop
  }
}
