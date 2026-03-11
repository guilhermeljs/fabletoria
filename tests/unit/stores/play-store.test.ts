import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayStore } from '../../../src/stores/play-store'
import { useProjectStore } from '../../../src/stores/project-store'

beforeEach(() => {
  useProjectStore.setState({
    narratives: {},
    nodes: {},
    connections: {},
    components: {},
    variations: {}
  })
  usePlayStore.setState({
    isActive: false,
    narrativeId: null,
    startNodeId: null,
    currentNodeId: null,
    history: []
  })
})

function buildGraph() {
  const narrative = useProjectStore.getState().createNarrative('Test')
  const start = useProjectStore.getState().createNode(narrative.id)
  const nodeA = useProjectStore.getState().createNode(narrative.id)
  const nodeB = useProjectStore.getState().createNode(narrative.id)
  const connA = useProjectStore.getState().createConnection(start.id, nodeA.id, 'right', 'left')!
  const connB = useProjectStore.getState().createConnection(start.id, nodeB.id, 'right', 'left')!
  useProjectStore.getState().setStartNode(narrative.id, start.id)
  return { narrative, start, nodeA, nodeB, connA, connB }
}

describe('Play store', () => {
  it('starts play mode with correct initial state', () => {
    const { narrative, start } = buildGraph()
    usePlayStore.getState().start(narrative.id, start.id)
    const state = usePlayStore.getState()
    expect(state.isActive).toBe(true)
    expect(state.currentNodeId).toBe(start.id)
    expect(state.startNodeId).toBe(start.id)
    expect(state.history).toHaveLength(0)
  })

  it('advances to target node on choose', () => {
    const { narrative, start, nodeA, connA } = buildGraph()
    usePlayStore.getState().start(narrative.id, start.id)
    usePlayStore.getState().choose(connA.id)
    const state = usePlayStore.getState()
    expect(state.currentNodeId).toBe(nodeA.id)
    expect(state.history).toEqual([start.id])
  })

  it('restarts back to start node', () => {
    const { narrative, start, connA } = buildGraph()
    usePlayStore.getState().start(narrative.id, start.id)
    usePlayStore.getState().choose(connA.id)
    usePlayStore.getState().restart()
    const state = usePlayStore.getState()
    expect(state.currentNodeId).toBe(start.id)
    expect(state.history).toHaveLength(0)
  })

  it('exits and resets all state', () => {
    const { narrative, start } = buildGraph()
    usePlayStore.getState().start(narrative.id, start.id)
    usePlayStore.getState().exit()
    const state = usePlayStore.getState()
    expect(state.isActive).toBe(false)
    expect(state.currentNodeId).toBeNull()
    expect(state.narrativeId).toBeNull()
    expect(state.history).toHaveLength(0)
  })

  it('ignores choose for unknown connection', () => {
    const { narrative, start } = buildGraph()
    usePlayStore.getState().start(narrative.id, start.id)
    usePlayStore.getState().choose('nonexistent-id')
    // Should still be at start node
    expect(usePlayStore.getState().currentNodeId).toBe(start.id)
  })
})
