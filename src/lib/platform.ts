// Platform detection: safe to call in browser and Electron renderer.
// Returns false in browser (safe default). Returns true only when running inside
// the Electron wrapper (preload injects window.electronAPI.isElectron = true).
// MUST NOT import anything from electron/

export interface ElectronAPI {
  isElectron: boolean
  // Feature 002 will extend this interface with MCP channel methods
}

export function isElectron(): boolean {
  return !!(window as unknown as Record<string, ElectronAPI>)['electronAPI']?.isElectron
}

export function getElectronAPI(): ElectronAPI | null {
  return (window as unknown as Record<string, ElectronAPI>)['electronAPI'] ?? null
}
