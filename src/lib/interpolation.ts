import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import type { VariationMap, AssetMap } from './types'

// Sentinel prefix to identify unresolved refs after HTML generation
const UNRESOLVED_SENTINEL = '\uFFF9'
const UNRESOLVED_SUFFIX = '\uFFFB'

// Sentinels for asset nodes (post-processed into HTML)
const ASSET_IMG_SENTINEL = '\uFFF0IMG:'
const ASSET_FILE_SENTINEL = '\uFFF0FILE:'
const ASSET_SENTINEL_END = '\uFFF1'

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
  byName: Record<string, Record<string, string | number>>,
  assets?: AssetMap
): { node: TiptapNode; hasUnresolved: boolean } {
  // Handle asset image nodes
  if (node.type === 'assetImage' && assets) {
    const assetId = node.attrs?.['assetId'] as string | undefined
    const width = node.attrs?.['width'] ?? '100%'
    const mt = node.attrs?.['marginTop'] ?? 0
    const mr = node.attrs?.['marginRight'] ?? 0
    const mb = node.attrs?.['marginBottom'] ?? 16
    const ml = node.attrs?.['marginLeft'] ?? 0
    const payload = JSON.stringify({ assetId, width, mt, mr, mb, ml })
    return {
      node: {
        type: 'paragraph',
        content: [{ type: 'text', text: `${ASSET_IMG_SENTINEL}${payload}${ASSET_SENTINEL_END}` }]
      },
      hasUnresolved: false
    }
  }

  // Handle asset file nodes
  if (node.type === 'assetFile' && assets) {
    const assetId = node.attrs?.['assetId'] as string | undefined
    const label = node.attrs?.['label'] as string | undefined ?? ''
    const payload = JSON.stringify({ assetId, label })
    return {
      node: { type: 'text', text: `${ASSET_FILE_SENTINEL}${payload}${ASSET_SENTINEL_END}` },
      hasUnresolved: false
    }
  }

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
      const result = walkAndResolve(child, byName, assets)
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
  selfValues?: Record<string, string | number>,
  assets?: AssetMap
): ResolveResult {
  // Build lookup: variationName → field values
  const byName: Record<string, Record<string, string | number>> = {}
  for (const variation of Object.values(variations)) {
    if (variation) {
      byName[variation.name] = variation.values
    }
  }
  if (selfValues) byName['self'] = selfValues

  const { node: resolved, hasUnresolved } = walkAndResolve(tiptapJson as TiptapNode, byName, assets)

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

  // Replace asset image sentinels with <img> tags
  if (assets) {
    const assetImgRegex = new RegExp(
      `${escapeRegex(ASSET_IMG_SENTINEL)}(.+?)${escapeRegex(ASSET_SENTINEL_END)}`,
      'g'
    )
    html = html.replace(assetImgRegex, (_match, payload: string) => {
      try {
        const { assetId, width, mt, mr, mb, ml } = JSON.parse(payload) as {
          assetId: string; width: number | string; mt: number; mr: number; mb: number; ml: number
        }
        const asset = assets[assetId]
        if (!asset) {
          return '<div style="background:#3f3f46;border:1px solid #71717a;padding:16px;border-radius:4px;color:#a1a1aa;font-size:12px">⚠ Asset deleted</div>'
        }
        const src = asset.sourceType === 'url'
          ? (asset.url ?? '')
          : (asset.data ? URL.createObjectURL(asset.data) : '')
        const style = `display:block;width:${typeof width === 'number' ? `${width}px` : width};height:auto;margin:${mt}px ${mr}px ${mb}px ${ml}px;`
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(asset.name)}" style="${style}" />`
      } catch { return '' }
    })

    // Replace asset file sentinels with <a> links
    const assetFileRegex = new RegExp(
      `${escapeRegex(ASSET_FILE_SENTINEL)}(.+?)${escapeRegex(ASSET_SENTINEL_END)}`,
      'g'
    )
    html = html.replace(assetFileRegex, (_match, payload: string) => {
      try {
        const { assetId, label } = JSON.parse(payload) as { assetId: string; label: string }
        const asset = assets[assetId]
        if (!asset) {
          return `<span style="text-decoration:line-through;color:#71717a" title="Asset deleted">📎 ${escapeHtml(label)}</span>`
        }
        const href = asset.sourceType === 'url'
          ? (asset.url ?? '#')
          : (asset.data ? URL.createObjectURL(asset.data) : '#')
        const download = asset.sourceType === 'local' ? ` download="${escapeHtml(asset.name)}"` : ' target="_blank" rel="noopener noreferrer"'
        return `<a href="${escapeHtml(href)}"${download} style="color:#a78bfa;text-decoration:underline;">📎 ${escapeHtml(label)}</a>`
      } catch { return '' }
    })
  }

  return { html, hasUnresolved }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
