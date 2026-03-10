import { contextBridge, ipcRenderer } from 'electron'

// Expose minimal API to renderer: isElectron flag + MCP channels (Feature 002).
// IMPORTANT: This file MUST NOT import any files from src/
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      isElectron: true,
      mcp: {
        start: () => ipcRenderer.invoke('mcp:start'),
        stop: () => ipcRenderer.invoke('mcp:stop'),
        status: () => ipcRenderer.invoke('mcp:status'),
        onMutation: (handler: (channel: string, payload: unknown, replyChannel: string) => void) => {
          // Listen for all mutation channels from main process
          const channels = [
            'narrative:create', 'node:create', 'node:createFromVariation',
            'node:update', 'node:setStart', 'node:delete',
            'edge:create', 'edge:delete', 'component:create',
            'variation:create', 'node:editContent'
          ]
          channels.forEach(channel => {
            ipcRenderer.on(channel, (_event, { payload, replyChannel }: { payload: unknown; replyChannel: string }) => {
              handler(channel, payload, replyChannel)
            })
          })
          // Return cleanup function
          return () => channels.forEach(channel => ipcRenderer.removeAllListeners(channel))
        },
        sendReply: (replyChannel: string, result: unknown) => {
          ipcRenderer.send(replyChannel, result)
        }
      }
    })
  } catch (error) {
    console.error('[preload] contextBridge.exposeInMainWorld failed:', error)
  }
} else {
  // Fallback for environments without context isolation (should not occur in production)
  ;(window as unknown as Record<string, unknown>)['electronAPI'] = { isElectron: true }
}
