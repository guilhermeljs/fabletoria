import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  applyNodeChanges,
  type Connection,
  type NodeChange,
  type Node,
  type Edge,
  useReactFlow,
  ReactFlowProvider,
  type FinalConnectionState,
  type EdgeChange,
  SelectionMode,
  ConnectionMode
} from '@xyflow/react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import { useContextMenuStore } from '../../stores/context-menu-store'
import StoryNodeComponent from './StoryNodeComponent'
import type { EntityId, StoryNode as StoryNodeData } from '../../lib/types'
import NodeEdge from './NodeEdge'
import { CursorTracker, RemoteCursors } from './RealtimeCursors'

const nodeTypes = { storyNode: StoryNodeComponent }
const edgeTypes = { default: NodeEdge }

const VARIATION_DRAG_TYPE = 'application/fabletoria-variation'

interface NarrativeCanvasProps {
  narrativeId: EntityId
}

function NarrativeCanvasInner({ narrativeId }: NarrativeCanvasProps) {
  const store = useProjectStore()
  const addToSelection = useUIStore((s) => s.addToSelection)
  const removeFromSelection = useUIStore((s) => s.removeFromSelection)

  const selection = useUIStore((s) => s.selection)
  const { screenToFlowPosition } = useReactFlow()
  const openMenu = useContextMenuStore((s) => s.open)
  const containerRef = useRef<HTMLDivElement>(null)
  const pendingConnectionRef = useRef<{ sourceNodeId: string } | null>(null)

  const nodes = useProjectStore((s) => s.nodes)
  const connections = useProjectStore((s) => s.connections)
  const narratives = useProjectStore((s) => s.narratives)
  const variations = useProjectStore((s) => s.variations)

  const narrative = narratives[narrativeId]

  const prevNodesRef = useRef<Map<string, { source: StoryNodeData; rfNode: Node }>>(new Map())
  // Build React Flow nodes from store (source of truth)

  const storeNodes = useMemo<Node[]>(() => {
    const cached = prevNodesRef.current
    const result: Node[] = []

    for (const n of Object.values(nodes)) {
      if (!n || n.narrativeId !== narrativeId) continue

      const variation = n.variationId ? variations[n.variationId] : undefined
      // eslint-disable-next-line react-hooks/refs
      const prev = cached.get(n.id)
      const isStartNode = narrative?.startNodeId === n.id

      if (prev && prev.source === n && prev.rfNode.data.isStartNode === isStartNode) {
        result.push(prev.rfNode)
        continue
      }

      const rfNode: Node = {
        id: n.id,
        type: 'storyNode',
        position: n.position,
        width: n.width || 100,
        height: n.height || 100,
        data: {
          content: n.content,
          title: n.title ?? '',
          isStartNode,
          variationId: n.variationId ?? undefined,
          variationName: variation?.name
        }
      }

      // eslint-disable-next-line react-hooks/refs
      cached.set(n.id, { source: n, rfNode })
      result.push(rfNode)
    }

    // eslint-disable-next-line react-hooks/refs
    for (const id of cached.keys()) {
      if (!nodes[id] || nodes[id].narrativeId !== narrativeId) {
        // eslint-disable-next-line react-hooks/refs
        cached.delete(id)
      }
    }

    return result
  }, [nodes, narrativeId, variations, narrative?.startNodeId])

  // Local display state — React Flow reads this for smooth real-time updates
  const [displayNodes, setDisplayNodes] = useState<Node[]>(storeNodes)

  // Sync from store when external changes arrive (Organize, MCP, content edits…)
  // but not while a drag is in progress (would snap node back to stored position)
  useEffect(() => {
    setDisplayNodes((prev) => {
      if (prev.some((n) => n.dragging)) return prev

      const selectionMap = new Map(prev.map((n) => [n.id, n.selected]))

      return storeNodes.map((n) => ({
        ...n,
        selected: selectionMap.get(n.id) ?? false
      }))
    })
  }, [storeNodes])

  // Build React Flow edges — no `selected` field
  const rfNodes = displayNodes
  const nodeIds = new Set(rfNodes.map((n) => n.id))
  const rfEdges: Edge[] = Object.values(connections)
    .filter(
      (c) =>
        c?.narrativeId === narrativeId && nodeIds.has(c.sourceNodeId) && nodeIds.has(c.targetNodeId)
    )
    .map((c) => {
      if (!c) return null
      return {
        id: c.id,
        selected: selection.some((n) => n.id === c.id),
        source: c.sourceNodeId,
        target: c.targetNodeId,
        sourceHandle: c.sourceHandle ?? null,
        targetHandle: c.targetHandle ?? null,
        type: 'default'
      }
    })
    .filter(Boolean) as Edge[]

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        store.createConnection(
          params.source,
          params.target,
          params.sourceHandle,
          params.targetHandle
        )
      }
    },
    [store]
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Always apply to display state for smooth real-time rendering (drag, resize, etc.)
      setDisplayNodes((prev) => applyNodeChanges(changes, prev))

      // Selectively persist to store
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          store.updateNodePosition(change.id, change.position)
        }
        if (change.type === 'dimensions' && change.dimensions && change.resizing === false) {
          store.updateNodeSize(change.id, change.dimensions.width, change.dimensions.height)
        }
        if (change.type === 'remove') {
          removeFromSelection(change.id)
          store.deleteNode(change.id)
        }
        if (change.type === 'select') {
          if (change.selected) {
            addToSelection({ type: 'node', id: change.id })
          } else {
            removeFromSelection(change.id)
          }
        }
      }
    },
    [store, addToSelection, removeFromSelection]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          removeFromSelection(change.id)
          store.deleteConnection(change.id)
        }
        if (change.type === 'select') {
          if (change.selected) {
            addToSelection({ type: 'edge', id: change.id })
          } else {
            removeFromSelection(change.id)
          }
        }
      }
    },
    [store, addToSelection, removeFromSelection]
  )

  const handleAddNode = useCallback(
    (clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY })
      const nodeId = store.createNode(narrativeId, { position })
      if (rfNodes?.length === 0) {
        store.setStartNode(nodeId.narrativeId, nodeId.id)
      }
    },
    [store, narrativeId, screenToFlowPosition, rfNodes?.length]
  )

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      openMenu(e.clientX, e.clientY, [
        {
          label: 'Set as Start Node',
          icon: 'Play',
          onClick: () => store.setStartNode(narrativeId, node.id)
        },
        { type: 'separator' },
        {
          label: 'Delete Node',
          icon: 'Trash2',
          variant: 'danger',
          onClick: () => store.deleteNode(node.id)
        }
      ])
    },
    [openMenu, store, narrativeId]
  )

  const onPaneContextMenu = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      e.preventDefault()
      const clientX = (e as React.MouseEvent).clientX
      const clientY = (e as React.MouseEvent).clientY
      openMenu(clientX, clientY, [
        {
          label: 'Add Story Piece',
          icon: 'Plus',
          onClick: () => handleAddNode(clientX, clientY)
        }
      ])
    },
    [openMenu, handleAddNode]
  )

  // Edge dropped on empty space → create a new connected node
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (connectionState.isValid) return
      const sourceNodeId = connectionState.fromNode?.id
      if (!sourceNodeId) return

      const clientX = 'clientX' in event ? event.clientX : (event.touches[0]?.clientX ?? 0)
      const clientY = 'clientY' in event ? event.clientY : (event.touches[0]?.clientY ?? 0)
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY })

      pendingConnectionRef.current = { sourceNodeId }
      // Defer to next tick so the document 'click' listener that closes menus
      // (fired by the same mouseup that ends the drag) runs first.
      setTimeout(() => {
        const newNode = store.createNode(narrativeId, { position: flowPos })
        useUIStore.getState().setSelection([{ type: 'node', id: newNode.id }])
        store.createConnection(sourceNodeId, newNode.id, connectionState.fromHandle?.position, null)
      }, 0)
    },
    [screenToFlowPosition, narrativeId, store]
  )

  // Drag-drop: variation onto canvas
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(VARIATION_DRAG_TYPE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const variationId = e.dataTransfer.getData(VARIATION_DRAG_TYPE)
      if (!variationId) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      store.createNode(narrativeId, { position, variationId })
    },
    [store, narrativeId, screenToFlowPosition]
  )

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        edgesFocusable
        selectionMode={SelectionMode.Partial}
        panOnScroll
        connectionMode={ConnectionMode.Loose}
        panOnDrag={false}
        snapToGrid={false}
        onDragOver={onDragOver}
        zoomOnDoubleClick={false}
        onDrop={onDrop}
        deleteKeyCode={['Delete']}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background color="#020617" gap={20} />
      </ReactFlow>

      {rfNodes.length === 0 && rfEdges.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
          Right-click to add the first story piece
        </div>
      )}

      <CursorTracker narrativeId={narrativeId} containerRef={containerRef}></CursorTracker>
      <RemoteCursors narrativeId={narrativeId} key={'remote'} />
    </div>
  )
}

export default function NarrativeCanvas({ narrativeId }: NarrativeCanvasProps) {
  return (
    <ReactFlowProvider>
      <NarrativeCanvasInner narrativeId={narrativeId} />
    </ReactFlowProvider>
  )
}
