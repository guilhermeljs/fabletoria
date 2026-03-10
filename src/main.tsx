import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { isElectron } from './lib/platform'
import { initMcpBridge } from './stores/project-store-mcp-bridge'

// Initialize MCP bridge only in Electron (desktop) builds
if (isElectron()) {
  initMcpBridge()
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
