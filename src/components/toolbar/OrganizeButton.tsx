import type { StoryNode } from '../../lib/types'
import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import { useSettingsStore } from '../../stores/settings-store'
import { calculateNodeSize } from '../../lib/layout-utils'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'

/** Calculates optimal handle pair using aspect-ratio weighting. */
function calculateBestHandles(source: StoryNode, target: StoryNode): { sourceHandle: string; targetHandle: string } {
  const sourceWidth = source.width || 200
  const sourceHeight = source.height || 100
  
  // Centers
  const sourceC = { x: source.position.x + sourceWidth / 2, y: source.position.y + sourceHeight / 2 }
  const targetC = { x: target.position.x + (target.width || 200) / 2, y: target.position.y + (target.height || 100) / 2 }
  
  const dx = targetC.x - sourceC.x
  const dy = targetC.y - sourceC.y
  
  // Aspect ratio weighting: S_rel = (dy / dx) * (W / H)
  const slopeRel = dx === 0 ? Infinity : (dy / dx) * (sourceWidth / sourceHeight)
  
  if (Math.abs(slopeRel) < 1) {
    // Horizontal dominance
    return dx >= 0 
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' }
  } else {
    // Vertical dominance
    return dy >= 0 
      ? { sourceHandle: 'bottom', targetHandle: 'top' }
      : { sourceHandle: 'top', targetHandle: 'bottom' }
  }
}

export default function OrganizeButton() {
  const activeNarrativeId = useUIStore((s) => s.activeNarrativeId)
  const selection = useUIStore((s) => s.selection)
  const narrative = useProjectStore((s) => (activeNarrativeId ? s.narratives[activeNarrativeId] : null))
  const nodes = useProjectStore((s) => s.nodes)
  const connections = useProjectStore((s) => s.connections)
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition)
  const updateNodeSize = useProjectStore((s) => s.updateNodeSize)
  const updateConnectionHandle = useProjectStore((s) => s.updateConnectionHandle)
  
  const { organizeRatio, organizeMaxWidth, organizeHGap, organizeVGap } = useSettingsStore()

  const handleOrganize = () => {
    if (!activeNarrativeId) return

    // Scope
    const selectedNodeIds = selection.filter(s => s.type === 'node').map(s => s.id)
    const isFiltered = selectedNodeIds.length > 1

    let targetNodes = Object.values(nodes).filter(n => n?.narrativeId === activeNarrativeId)
    if (isFiltered) targetNodes = targetNodes.filter(n => selectedNodeIds.includes(n.id))
    if (targetNodes.length === 0) return
    const targetNodeIds = new Set(targetNodes.map(n => n.id))

    const targetConnections = Object.values(connections).filter(
      c => c?.narrativeId === activeNarrativeId && targetNodeIds.has(c.sourceNodeId) && targetNodeIds.has(c.targetNodeId)
    )

    // Clone nodes for in-memory updates
    const localNodes: Record<string, StoryNode> = {}
    targetNodes.forEach(n => {
      localNodes[n.id] = { ...n } // shallow clone
    })

    // Build children map
    const children = new Map<string, string[]>()
    targetNodes.forEach(n => children.set(n.id, []))
    targetConnections.forEach(c => {
      if (children.has(c.sourceNodeId)) children.get(c.sourceNodeId)!.push(c.targetNodeId)
    })

    const rootId = (narrative?.startNodeId && targetNodeIds.has(narrative.startNodeId)) 
      ? narrative.startNodeId 
      : targetNodes[0]!.id

    // BFS per depth
    const levelNodes = new Map<number, string[]>()
    const visited = new Set<string>()
    const queue = [{ id: rootId, depth: 0 }]
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

    const disconnected = targetNodes.filter(n => !visited.has(n.id)).map(n => n.id)
    if (disconnected.length > 0) levelNodes.set(levelNodes.size, disconnected)

    // 1. Auto-resize in localNodes
    Object.values(localNodes).forEach(n => {
      const { width, height } = calculateNodeSize(n.content, organizeRatio, organizeMaxWidth)
      n.width = width
      n.height = height
    })

    // 2. Position with dynamic widths/heights
    const origin = localNodes[rootId]!.position
    const levelX = new Map<number, number>()
    levelX.set(0, origin.x)

    for (let d = 0; d < levelNodes.size; d++) {
      const ids = levelNodes.get(d)!
      const currentX = levelX.get(d) || origin.x
      
      let maxLevelWidth = 0
      let totalHeight = ids.reduce((sum, id) => sum + (localNodes[id]?.height || 100), 0)
      totalHeight += (ids.length - 1) * organizeVGap
      const topY = origin.y - totalHeight / 2

      let yOffset = topY
      ids.forEach(id => {
        const node = localNodes[id]!
        const h = node.height || 100
        const w = node.width || 200
        node.position = { x: currentX, y: yOffset + h / 2 }
        yOffset += h + organizeVGap
        maxLevelWidth = Math.max(maxLevelWidth, w)
      })

      levelX.set(d + 1, currentX + maxLevelWidth + organizeHGap)
    }

    // 3. Reroute handles using localNodes
    targetConnections.forEach(conn => {
      const s = localNodes[conn.sourceNodeId]
      const t = localNodes[conn.targetNodeId]
      const { sourceHandle, targetHandle } = calculateBestHandles(s!, t!)
      conn.sourceHandle = sourceHandle
      conn.targetHandle = targetHandle
    })

    // 4. Commit changes to store
    Object.values(localNodes).forEach(n => {
      updateNodeSize(n.id, n.width!, n.height!)
      updateNodePosition(n.id, n.position)
    })

    targetConnections.forEach(conn => {
      updateConnectionHandle(conn.id, conn.sourceHandle!, conn.targetHandle!)
    })
  }

  return (

    <BaseButton
      variant="ghost"
      size="sm"
      onClick={handleOrganize}
      disabled={!activeNarrativeId}
      title="Organize Nodes"
    >
      <BaseIcon name="ListTree" size={18} />
    </BaseButton>
  )
}
