import { describe, it, expect } from 'vitest'
import { resolveContent } from '../../../src/lib/interpolation'
import type { VariationMap } from '../../../src/lib/types'

const variations: VariationMap = {
  v1: {
    id: 'v1',
    componentId: 'c1',
    name: 'hero',
    values: { name: 'Aldric', level: 5 },
    createdAt: 0,
    updatedAt: 0
  }
}

describe('resolveContent', () => {
  it('resolves a simple paragraph with no variables', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }]
    }
    const { html, hasUnresolved } = resolveContent(doc, variations)
    expect(html).toContain('Hello world')
    expect(hasUnresolved).toBe(false)
  })

  it('resolves a variableNode token to its field value', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variableNode',
              attrs: { variationName: 'hero', fieldName: 'name', raw: '{{hero.name}}' }
            }
          ]
        }
      ]
    }
    const { html, hasUnresolved } = resolveContent(doc, variations)
    expect(html).toContain('Aldric')
    expect(hasUnresolved).toBe(false)
  })

  it('marks unresolved variable with hasUnresolved=true', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variableNode',
              attrs: { variationName: 'villain', fieldName: 'name', raw: '{{villain.name}}' }
            }
          ]
        }
      ]
    }
    const { html, hasUnresolved } = resolveContent(doc, variations)
    expect(hasUnresolved).toBe(true)
    expect(html).toContain('{{villain.name}}')
  })

  it('handles empty doc without errors', () => {
    const doc = { type: 'doc', content: [] }
    const { html, hasUnresolved } = resolveContent(doc, {})
    expect(hasUnresolved).toBe(false)
    expect(typeof html).toBe('string')
  })

  it('resolves number fields as strings', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variableNode',
              attrs: { variationName: 'hero', fieldName: 'level', raw: '{{hero.level}}' }
            }
          ]
        }
      ]
    }
    const { html } = resolveContent(doc, variations)
    expect(html).toContain('5')
  })
})
