import { create } from 'zustand'

export type McpServerStatus = 'stopped' | 'starting' | 'running' | 'stopping'

export interface McpServerState {
  status: McpServerStatus
  port: number | null
  url: string | null
  error: string | null
}

interface McpStore extends McpServerState {
  setStarting: () => void
  setRunning: (port: number, url: string) => void
  setStopping: () => void
  setStopped: () => void
  setError: (error: string) => void
}

export const useMcpStore = create<McpStore>()((set) => ({
  status: 'stopped',
  port: null,
  url: null,
  error: null,

  setStarting: () => set({ status: 'starting', error: null }),
  setRunning: (port, url) => set({ status: 'running', port, url, error: null }),
  setStopping: () => set({ status: 'stopping' }),
  setStopped: () => set({ status: 'stopped', port: null, url: null }),
  setError: (error) => set({ status: 'stopped', port: null, url: null, error })
}))
