import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../../../src/stores/project-store'

beforeEach(() => {
  // Reset store to initial state before each test
  useProjectStore.setState({
    narratives: {},
    nodes: {},
    connections: {},
    components: {},
    variations: {}
  })
  useProjectStore.temporal.getState().clear()
})

describe('Narrative CRUD', () => {
  it('creates a narrative with correct fields', () => {
    const n = useProjectStore.getState().createNarrative('Chapter 1')
    const state = useProjectStore.getState()
    expect(state.narratives[n.id]).toMatchObject({
      id: n.id,
      name: 'Chapter 1',
      startNodeId: null
    })
  })

  it('renames a narrative', () => {
    const n = useProjectStore.getState().createNarrative('Old Name')
    useProjectStore.getState().renameNarrative(n.id, 'New Name')
    expect(useProjectStore.getState().narratives[n.id]?.name).toBe('New Name')
  })

  it('deletes a narrative and cascades to nodes and connections', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node1 = useProjectStore.getState().createNode(n.id)
    const node2 = useProjectStore.getState().createNode(n.id)
    useProjectStore.getState().createConnection(node1.id, node2.id)

    useProjectStore.getState().deleteNarrative(n.id)
    const state = useProjectStore.getState()
    expect(state.narratives[n.id]).toBeUndefined()
    expect(state.nodes[node1.id]).toBeUndefined()
    expect(state.nodes[node2.id]).toBeUndefined()
    expect(Object.values(state.connections)).toHaveLength(0)
  })

  it('ensureDefaultNarrative returns existing narrative if present', () => {
    const existing = useProjectStore.getState().createNarrative('Existing')
    const result = useProjectStore.getState().ensureDefaultNarrative()
    expect(result.id).toBe(existing.id)
  })

  it('ensureDefaultNarrative creates one if none exist', () => {
    const result = useProjectStore.getState().ensureDefaultNarrative()
    expect(result.name).toBe('My Narrative')
    expect(Object.keys(useProjectStore.getState().narratives)).toHaveLength(1)
  })
})

describe('Node actions', () => {
  it('creates a node with default empty content', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node = useProjectStore.getState().createNode(n.id)
    expect(node.narrativeId).toBe(n.id)
    expect(JSON.parse(node.content)).toMatchObject({ type: 'doc' })
    expect(node.variationId).toBeNull()
  })

  it('creates a node with a variation ID', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const c = useProjectStore.getState().createComponent('Character')
    const result = useProjectStore.getState().createVariation(c.id, 'hero')
    if ('error' in result) throw new Error('Unexpected error')
    const node = useProjectStore.getState().createNode(n.id, { variationId: result.variation.id })
    expect(node.variationId).toBe(result.variation.id)
  })

  it('updates node content', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node = useProjectStore.getState().createNode(n.id)
    const newContent = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] })
    useProjectStore.getState().updateNodeContent(node.id, newContent)
    expect(useProjectStore.getState().nodes[node.id]?.content).toBe(newContent)
  })

  it('deletes node and removes related connections', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node1 = useProjectStore.getState().createNode(n.id)
    const node2 = useProjectStore.getState().createNode(n.id)
    const node3 = useProjectStore.getState().createNode(n.id)
    useProjectStore.getState().createConnection(node1.id, node2.id)
    useProjectStore.getState().createConnection(node2.id, node3.id)

    useProjectStore.getState().deleteNode(node2.id)
    const state = useProjectStore.getState()
    expect(state.nodes[node2.id]).toBeUndefined()
    expect(Object.values(state.connections)).toHaveLength(0)
  })

  it('deletes node and clears startNodeId from narrative', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node = useProjectStore.getState().createNode(n.id)
    useProjectStore.getState().setStartNode(n.id, node.id)
    expect(useProjectStore.getState().narratives[n.id]?.startNodeId).toBe(node.id)

    useProjectStore.getState().deleteNode(node.id)
    expect(useProjectStore.getState().narratives[n.id]?.startNodeId).toBeNull()
  })

  it('sets start node', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node = useProjectStore.getState().createNode(n.id)
    useProjectStore.getState().setStartNode(n.id, node.id)
    expect(useProjectStore.getState().narratives[n.id]?.startNodeId).toBe(node.id)
  })
})

describe('Connection actions', () => {
  it('creates a connection between nodes in same narrative', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node1 = useProjectStore.getState().createNode(n.id)
    const node2 = useProjectStore.getState().createNode(n.id)
    const connection = useProjectStore.getState().createConnection(node1.id, node2.id, 'Go right')
    expect(connection).not.toBeNull()
    expect(connection?.sourceNodeId).toBe(node1.id)
    expect(connection?.targetNodeId).toBe(node2.id)
    expect(connection?.label).toBe('Go right')
  })

  it('rejects connection between nodes in different narratives', () => {
    const n1 = useProjectStore.getState().createNarrative('N1')
    const n2 = useProjectStore.getState().createNarrative('N2')
    const node1 = useProjectStore.getState().createNode(n1.id)
    const node2 = useProjectStore.getState().createNode(n2.id)
    const result = useProjectStore.getState().createConnection(node1.id, node2.id)
    expect(result).toBeNull()
  })

  it('updates connection label', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node1 = useProjectStore.getState().createNode(n.id)
    const node2 = useProjectStore.getState().createNode(n.id)
    const conn = useProjectStore.getState().createConnection(node1.id, node2.id)!
    useProjectStore.getState().updateConnectionLabel(conn.id, 'Updated')
    expect(useProjectStore.getState().connections[conn.id]?.label).toBe('Updated')
  })

  it('deletes a connection', () => {
    const n = useProjectStore.getState().createNarrative('Test')
    const node1 = useProjectStore.getState().createNode(n.id)
    const node2 = useProjectStore.getState().createNode(n.id)
    const conn = useProjectStore.getState().createConnection(node1.id, node2.id)!
    useProjectStore.getState().deleteConnection(conn.id)
    expect(useProjectStore.getState().connections[conn.id]).toBeUndefined()
  })
})

describe('Component and Variation CRUD', () => {
  it('creates a component with empty schema', () => {
    const c = useProjectStore.getState().createComponent('Character')
    expect(c.schema).toEqual([])
    expect(c.name).toBe('Character')
  })

  it('updates component schema', () => {
    const c = useProjectStore.getState().createComponent('Character')
    useProjectStore.getState().updateComponentSchema(c.id, [
      { name: 'name', type: 'string' },
      { name: 'level', type: 'number' }
    ])
    expect(useProjectStore.getState().components[c.id]?.schema).toHaveLength(2)
  })

  it('deletes component and cascades to variations', () => {
    const c = useProjectStore.getState().createComponent('Character')
    const result = useProjectStore.getState().createVariation(c.id, 'hero')
    if ('error' in result) throw new Error('Unexpected error')

    useProjectStore.getState().deleteComponent(c.id)
    const state = useProjectStore.getState()
    expect(state.components[c.id]).toBeUndefined()
    expect(state.variations[result.variation.id]).toBeUndefined()
  })

  it('enforces project-wide variation name uniqueness on create', () => {
    const c1 = useProjectStore.getState().createComponent('C1')
    const c2 = useProjectStore.getState().createComponent('C2')
    useProjectStore.getState().createVariation(c1.id, 'hero')
    const result = useProjectStore.getState().createVariation(c2.id, 'hero')
    expect('error' in result).toBe(true)
  })

  it('enforces project-wide variation name uniqueness on rename', () => {
    const c = useProjectStore.getState().createComponent('C')
    const r1 = useProjectStore.getState().createVariation(c.id, 'hero')
    const r2 = useProjectStore.getState().createVariation(c.id, 'villain')
    if ('error' in r1 || 'error' in r2) throw new Error('Setup failed')
    const result = useProjectStore.getState().renameVariation(r2.variation.id, 'hero')
    expect('error' in result).toBe(true)
  })

  it('allows renaming to own current name', () => {
    const c = useProjectStore.getState().createComponent('C')
    const r = useProjectStore.getState().createVariation(c.id, 'hero')
    if ('error' in r) throw new Error('Setup failed')
    const result = useProjectStore.getState().renameVariation(r.variation.id, 'hero')
    expect('ok' in result && result.ok).toBe(true)
  })
})
