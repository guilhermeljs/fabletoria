// IPC bridge: main process calls renderer store actions via this bridge.
// Tool handlers call ipcBridge.invoke(channel, payload) which sends to renderer
// and waits for the reply via a unique reply channel.

import { BrowserWindow } from 'electron'

export interface ToolSuccessResult {
  ok: true
  [key: string]: unknown
}

export interface ToolErrorResult {
  ok: false
  code: string
  message: string
}

export type ToolResult = ToolSuccessResult | ToolErrorResult

export const ipcBridge = {
  async invoke(channel: string, payload: unknown): Promise<ToolResult> {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) {
      return { ok: false, code: 'NO_WINDOW', message: 'Fabletoria window is not available' }
    }

    return new Promise<ToolResult>((resolve) => {
      const replyChannel = `${channel}:reply:${Date.now()}:${Math.random().toString(36).slice(2)}`

      win.webContents.ipc.once(replyChannel, (_event, result: ToolResult) => {
        resolve(result)
      })

      win.webContents.send(channel, { payload, replyChannel })
    })
  }
}
