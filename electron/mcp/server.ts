// MCP HTTP server — SSE transport, fixed port 7700
// Runs in Electron main process. Started/stopped via IPC from renderer.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { registerAllTools } from './registry'
import './tools/narrative'
import './tools/node'
import './tools/edge'
import './tools/component'
import './tools/variation'
import './tools/query'
import cors from 'cors'

const PORT = 7700

let mcpServer: McpServer | null = null
let httpServer: http.Server | null = null
const activeTransports: Map<string, SSEServerTransport> = new Map()

export interface McpStartResult {
  ok: true
  port: number
  url: string
}

export interface McpStopResult {
  ok: true
}

export interface McpStatusResult {
  running: boolean
  port: number | null
  url: string | null
}

export interface McpErrorResult {
  ok: false
  error: string
  message: string
}

export async function startMcpServer(): Promise<McpStartResult | McpErrorResult> {
  if (httpServer?.listening) {
    return { ok: true, port: PORT, url: `http://127.0.0.1:${PORT}/sse` }
  }

  mcpServer = new McpServer({
    name: 'fabletoria',
    version: '1.0.0'
  })

  registerAllTools(mcpServer)

  const app = express()

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )

  app.get('/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/messages', res)
    activeTransports.set(transport.sessionId, transport)
    res.on('close', () => {
      activeTransports.delete(transport.sessionId)
    })
    if (mcpServer?.isConnected()) {
      await transport.close()
      await mcpServer.close()
    }
    await mcpServer!.connect(transport)
  })

  app.post('/messages', async (req, res) => {
    const sessionId = req.query['sessionId'] as string
    const transport = activeTransports.get(sessionId)
    if (!transport) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    await transport.handlePostMessage(req, res)
  })

  httpServer = http.createServer(app)

  return new Promise((resolve) => {
    httpServer!.listen(PORT, '127.0.0.1', () => {
      const addr = httpServer!.address() as AddressInfo
      resolve({ ok: true, port: addr.port, url: `http://127.0.0.1:${addr.port}/sse` })
    })

    httpServer!.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve({
          ok: false,
          error: 'PORT_IN_USE',
          message: `Port ${PORT} is already in use. Change the MCP port in Settings.`
        })
      } else {
        resolve({ ok: false, error: 'SERVER_ERROR', message: err.message })
      }
    })
  })
}

export async function stopMcpServer(): Promise<McpStopResult> {
  // Close all active SSE transports
  for (const transport of activeTransports.values()) {
    try {
      await transport.close()
    } catch {
      /* ignore */
    }
  }
  activeTransports.clear()

  // Close HTTP server
  if (httpServer?.listening) {
    await new Promise<void>((resolve) => httpServer!.close(() => resolve()))
  }

  httpServer = null
  mcpServer = null

  return { ok: true }
}

export function getMcpStatus(): McpStatusResult {
  const running = !!httpServer?.listening
  return {
    running,
    port: running ? PORT : null,
    url: running ? `http://127.0.0.1:${PORT}/sse` : null
  }
}

export function stopOnQuit(): void {
  stopMcpServer().catch(console.error)
}
