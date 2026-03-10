import { Node, mergeAttributes, InputRule } from '@tiptap/core'

export const VariableNode = Node.create({
  name: 'variableNode',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      variationName: { default: null },
      fieldName: { default: null },
      raw: { default: null }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false
          const element = el as HTMLElement
          const raw = element.textContent ?? ''
          const match = /\{\{(\w+)\.(\w+)\}\}/.exec(raw)
          if (!match) return false
          return {
            variationName: match[1],
            fieldName: match[2],
            raw
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes['raw'] as string | null
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': '',
        style:
          'background: rgba(108,99,255,0.15); border-radius: 3px; padding: 0 2px; font-family: monospace; font-size: 0.9em;'
      }),
      raw ?? ''
    ]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\{\{(\w+)\.(\w+)\}\}$/,
        handler: ({ state, range, match }) => {
          const [full, variationName, fieldName] = match
          if (!variationName || !fieldName) return
          const { tr } = state
          const node = this.type.create({
            variationName,
            fieldName,
            raw: full
          })
          tr.replaceWith(range.from, range.to, node)
        }
      })
    ]
  }
})
