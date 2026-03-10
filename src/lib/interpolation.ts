import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import type { VariationMap } from './types'

// Sentinel prefix to identify unresolved refs after HTML generation
const UNRESOLVED_SENTINEL = '\uFFF9'
const UNRESOLVED_SUFFIX = '\uFFFB'

interface TiptapNode {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

/**
 * Walk the Tiptap JSON AST and replace variableNode tokens with text nodes.
 * Resolved → literal value.
 * Unresolved → sentinel-wrapped raw token (replaced with styled span after generateHTML).
 */
function walkAndResolve(
  node: TiptapNode,
  byName: Record<string, Record<string, string | number>>
): { node: TiptapNode; hasUnresolved: boolean } {
  if (node.type === 'variableNode') {
    const variationName = node.attrs?.['variationName'] as string | undefined
    const fieldName = node.attrs?.['fieldName'] as string | undefined
    const raw = node.attrs?.['raw'] as string | undefined

    if (variationName && fieldName) {
      const values = byName[variationName]
      if (values && fieldName in values) {
        return {
          node: { type: 'text', text: String(values[fieldName] ?? '') },
          hasUnresolved: false
        }
      }
    }

    // Unresolved: use sentinel markers so we can post-process the HTML
    const display = raw ?? `{{${variationName ?? '?'}.${fieldName ?? '?'}}}`
    return {
      node: { type: 'text', text: `${UNRESOLVED_SENTINEL}${display}${UNRESOLVED_SUFFIX}` },
      hasUnresolved: true
    }
  }

  if (node.content && node.content.length > 0) {
    let hasUnresolved = false
    const resolved = node.content.map((child) => {
      const result = walkAndResolve(child, byName)
      if (result.hasUnresolved) hasUnresolved = true
      return result.node
    })
    return { node: { ...node, content: resolved }, hasUnresolved }
  }

  return { node, hasUnresolved: false }
}

export interface ResolveResult {
  html: string
  hasUnresolved: boolean
}

/**
 * Resolve a Tiptap JSON document against the current variation store.
 * Returns the rendered HTML string and whether any references were unresolved.
 */
/**
 * Resolve {{self.fieldName}} in a plain title string.
 * Unresolved refs are left as-is.
 */
export function resolveTitle(title: string, selfValues?: Record<string, string | number>): string {
  if (!selfValues) return title
  return title.replace(/\{\{self\.(\w+)\}\}/g, (match, field: string) =>
    field in selfValues ? String(selfValues[field]) : match
  )
}

export function resolveContent(
  tiptapJson: object,
  variations: VariationMap,
  selfValues?: Record<string, string | number>
): ResolveResult {
  // Build lookup: variationName → field values
  const byName: Record<string, Record<string, string | number>> = {}
  for (const variation of Object.values(variations)) {
    if (variation) {
      byName[variation.name] = variation.values
    }
  }
  if (selfValues) byName['self'] = selfValues

  const { node: resolved, hasUnresolved } = walkAndResolve(tiptapJson as TiptapNode, byName)

  let html = generateHTML(resolved, [StarterKit])

  // Replace sentinel-wrapped tokens with styled spans
  if (hasUnresolved) {
    const sentinelRegex = new RegExp(
      `${escapeRegex(UNRESOLVED_SENTINEL)}(.+?)${escapeRegex(UNRESOLVED_SUFFIX)}`,
      'g'
    )
    html = html.replace(sentinelRegex, (_match, content: string) => {
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<span class="unresolved-ref">${escaped}</span>`
    })
  }

  return { html, hasUnresolved }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
