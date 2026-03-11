import type { StoryNode } from '../../lib/types'
import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'

const X_GAP = 400  // horizontal distance between levels
const Y_GAP = 200  // vertical distance between siblings

/** Returns the handle id ('right' | 'left' | 'bottom' | 'top') that best faces the target node. */
function bestSourceHandle(source: StoryNode, target: StoryNode): string {
  const dx = target.position.x - source.position.x
  const dy = target.position.y - source.position.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left'
  }
  return dy >= 0 ? 'bottom' : 'top'
}

export default function OrganizeButton() {
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const narrative = useProjectStore((s) => (activeNarrativeId ? s.narratives[activeNarrativeId] : null))
  const nodes = useProjectStore((s) => s.nodes)
  const connections = useProjectStore((s) => s.connections)
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition)
  const updateConnectionHandle = useProjectStore((s) => s.updateConnectionHandle)

  /** Re-routes every connection to use the handle that best faces the target. */
  function rerouteConnections(narrativeConnections: (typeof connections[string])[]) {
    for (const conn of narrativeConnections) {
      if (!conn) continue
      const source = nodes[conn.sourceNodeId]
      const target = nodes[conn.targetNodeId]
      if (!source || !target) continue
      updateConnectionHandle(conn.id, bestSourceHandle(source, target))
    }
  }

  const handleOrganize = () => {
    if (!activeNarrativeId) return

    const narrativeNodes = Object.values(nodes).filter((n) => n?.narrativeId === activeNarrativeId)
    const narrativeConnections = Object.values(connections).filter((c) => c?.narrativeId === activeNarrativeId)
    if (narrativeNodes.length === 0) return

    // Build children map
    const children = new Map<string, string[]>()
    for (const node of narrativeNodes) {
      if (node) children.set(node.id, [])
    }
    for (const conn of narrativeConnections) {
      if (conn) children.get(conn.sourceNodeId)?.push(conn.targetNodeId)
    }

    // Root = start node, or first node as fallback
    const rootId = narrative?.startNodeId ?? narrativeNodes[0]?.id
    if (!rootId) return
    const root = nodes[rootId]
    if (!root) return

    const originX = root.position.x
    const originY = root.position.y

    // BFS to collect nodes per depth level
    const levelNodes = new Map<number, string[]>()
    const visited = new Set<string>()
    const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)

      if (!levelNodes.has(depth)) levelNodes.set(depth, [])
      levelNodes.get(depth)!.push(id)

      for (const childId of children.get(id) ?? []) {
        if (!visited.has(childId)) queue.push({ id: childId, depth: depth + 1 })
      }
    }

    // Handle disconnected nodes: append after last level
    const disconnectedIds = narrativeNodes
      .map((n) => n!.id)
      .filter((id) => !visited.has(id))
    if (disconnectedIds.length > 0) {
      const nextDepth = levelNodes.size
      levelNodes.set(nextDepth, disconnectedIds)
    }

    // Assign positions
    for (const [depth, ids] of levelNodes) {
      const x = originX + depth * X_GAP
      const totalHeight = (ids.length - 1) * Y_GAP
      const topY = originY - totalHeight / 2
      ids.forEach((id, i) => {
        updateNodePosition(id, { x, y: topY + i * Y_GAP })
      })
    }

    rerouteConnections(narrativeConnections)
  }

  return (
    <button
      onClick={handleOrganize}
      disabled={!activeNarrativeId}
      className="px-4 py-1.5 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Organize
    </button>
  )
}
