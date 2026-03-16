// Tool registry — explicit registration pattern (FR-007a)
// Each tool module calls registerTool() at startup.
// No other file needs modification to add a new tool.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ZodRawShape } from 'zod'

export interface ToolDefinition {
  name: string
  description: string
  schema: ZodRawShape
  handler: (
    params: Record<string, unknown>
  ) => Promise<{ content: Array<{ type: 'text'; text: string }> }>
}

const registry: ToolDefinition[] = []

export function registerTool(definition: ToolDefinition): void {
  registry.push(definition)
}

export function registerAllTools(server: McpServer): void {
  for (const tool of registry) {
    server.tool(tool.name, tool.description, tool.schema, tool.handler)
  }
}
