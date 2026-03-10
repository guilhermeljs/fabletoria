import { contextBridge } from 'electron'

// Expose minimal API to renderer: only isElectron flag.
// Feature 002 will extend this with MCP channels via additional contextBridge entries.
// IMPORTANT: This file MUST NOT import any files from src/
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      isElectron: true
    })
  } catch (error) {
    console.error('[preload] contextBridge.exposeInMainWorld failed:', error)
  }
} else {
  // Fallback for environments without context isolation (should not occur in production)
  ;(window as unknown as Record<string, unknown>)['electronAPI'] = { isElectron: true }
}
