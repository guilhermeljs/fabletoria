import { useCallback, useRef, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  type Connection,
  type NodeChange,
  type Node,
  type Edge,
  useReactFlow,
  ReactFlowProvider,
  type FinalConnectionState,
  type EdgeChange,
  type OnSelectionChangeParams,
  SelectionMode
} from '@xyflow/react'
import { useProjectStore } from '../../stores/project-store'
import { useUIStore } from '../../stores/ui-store'
import StoryNodeComponent from './StoryNodeComponent'
import type { EntityId } from '../../lib/types'
import type { SelectionItem } from '../../stores/ui-store'
import NodeEdge from './NodeEdge'

const nodeTypes = { storyNode: StoryNodeComponent }
const edgeTypes = { default: NodeEdge }

const VARIATION_DRAG_TYPE = 'application/narrativeflow-variation'

interface ContextMenu {
  type: 'node' | 'pane' | 'edgeDrop'
  nodeId?: string
  x: number
  y: number
  flowX?: number
  flowY?: number
  sourceNodeId?: string
}

interface NarrativeCanvasProps {
  narrativeId: EntityId
}

function NarrativeCanvasInner({ narrativeId }: NarrativeCanvasProps) {
  const store = useProjectStore()
  const setSelection = useUIStore((s) => s.setSelection)
  const addToSelection = useUIStore((s) => s.addToSelection)
  const removeFromSelection = useUIStore((s) => s.removeFromSelection)

  const selection = useUIStore((s) => s.selection)
  const { screenToFlowPosition } = useReactFlow()
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pendingConnectionRef = useRef<{ sourceNodeId: string } | null>(null)

  const nodes = useProjectStore((s) => s.nodes)
  const connections = useProjectStore((s) => s.connections)
  const narratives = useProjectStore((s) => s.narratives)
  const variations = useProjectStore((s) => s.variations)

  const narrative = narratives[narrativeId]

  // Build React Flow nodes — no `selected` field: ReactFlow manages selection internally
  const rfNodes: Node[] = Object.values(nodes)
    .filter((n) => n?.narrativeId === narrativeId)
    .map((n) => {
      if (!n) return null
      const variation = n.variationId ? variations[n.variationId] : undefined
      return {
        id: n.id,
        type: 'storyNode',
        position: n.position,
        selected: selection.some((s) => s.id === n.id),
        data: {
          content: n.content,
          title: n.title ?? '',
          isStartNode: narrative?.startNodeId === n.id,
          variationId: n.variationId ?? undefined,
          variationName: variation?.name
        }
      }
    })
    .filter(Boolean) as Node[]

  // Build React Flow edges — no `selected` field
  const nodeIds = new Set(rfNodes.map((n) => n.id))
  const rfEdges: Edge[] = Object.values(connections)
    .filter((c) => c?.narrativeId === narrativeId && nodeIds.has(c.sourceNodeId) && nodeIds.has(c.targetNodeId))
    .map((c) => {
      if (!c) return null
      return {
        id: c.id,
        selected: selection.some((s) => s.id === c.id),
        source: c.sourceNodeId,
        target: c.targetNodeId,
        sourceHandle: c.sourceHandle ?? null,
        targetHandle: 'target',
        type: 'default'
      }
    })
    .filter(Boolean) as Edge[]

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        store.createConnection(params.source, params.target, params.sourceHandle)
      }
    },
    [store]
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          store.updateNodePosition(change.id, change.position)
        }
        if (change.type === 'remove') {
          store.deleteNode(change.id)
        }
        if(change.type === 'select') {
          if(change.selected) {
            addToSelection({ type: 'node', id: change.id })
          }else{
            removeFromSelection(change.id)
          }
        }
      }
    },
    [store]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          store.deleteConnection(change.id)
        }
        if(change.type === 'select') {
          if(change.selected) {
            addToSelection({ type: 'edge', id: change.id })
          }else{
            removeFromSelection(change.id)
          }
        }
      }
    },
    [store]
  )

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    setContextMenu({ type: 'node', nodeId: node.id, x: e.clientX, y: e.clientY })
  }, [])

  const onPaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ type: 'pane', x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY })
  }, [])

  const onPaneClick = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleAddNode = useCallback(
    (clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY })
      store.createNode(narrativeId, { position })
      setContextMenu(null)
    },
    [store, narrativeId, screenToFlowPosition]
  )

  // Edge dropped on empty space → show picker menu
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (connectionState.isValid) return
      const sourceNodeId = connectionState.fromNode?.id
      if (!sourceNodeId) return

      const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX ?? 0
      const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY ?? 0
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY })

      pendingConnectionRef.current = { sourceNodeId }
      // Defer to next tick so the document 'click' listener that closes menus
      // (fired by the same mouseup that ends the drag) runs first.
      setTimeout(() => {
        setContextMenu({
          type: 'edgeDrop',
          x: clientX,
          y: clientY,
          flowX: flowPos.x,
          flowY: flowPos.y,
          sourceNodeId
        })
      }, 0)
    },
    [screenToFlowPosition]
  )

  const handleEdgeDropAddNode = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'edgeDrop') return
    const position = { x: contextMenu.flowX ?? 0, y: contextMenu.flowY ?? 0 }
    const newNode = store.createNode(narrativeId, { position })
    if (contextMenu.sourceNodeId) {
      store.createConnection(contextMenu.sourceNodeId, newNode.id)
    }
    setContextMenu(null)
    pendingConnectionRef.current = null
  }, [store, narrativeId, contextMenu])

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

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      const items: SelectionItem[] = [
        ...selectedNodes.map((n) => ({ type: 'node' as const, id: n.id })),
        ...selectedEdges.map((e) => ({ type: 'edge' as const, id: e.id }))
      ]
      setSelection(items)
    },
    [setSelection]
  )

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

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
        onPaneClick={onPaneClick}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        edgesFocusable
        selectionMode={SelectionMode.Partial}
        panOnScroll
        panOnDrag={false}
        snapToGrid={false}
        onDragOver={onDragOver}
        zoomOnDoubleClick={false}
        onDrop={onDrop}
        deleteKeyCode={['Delete']}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background color="#2a2a3e" gap={20} />
      </ReactFlow>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#1e1e2e',
            border: '1px solid #4a4a6a',
            borderRadius: 6,
            padding: '4px 0',
            zIndex: 1000,
            minWidth: 160,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'pane' && (
            <button
              className="context-menu-item"
              style={menuItemStyle}
              onClick={() => handleAddNode(contextMenu.x, contextMenu.y)}
            >
              Add Story Piece
            </button>
          )}
          {contextMenu.type === 'edgeDrop' && (
            <>
              <div style={{ padding: '4px 14px 2px', fontSize: 10, color: '#6c7086', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add and connect
              </div>
              <button
                style={menuItemStyle}
                onClick={handleEdgeDropAddNode}
              >
                Story Piece
              </button>
            </>
          )}
          {contextMenu.type === 'node' && contextMenu.nodeId && (
            <>
              <button
                style={menuItemStyle}
                onClick={() => {
                  store.setStartNode(narrativeId, contextMenu.nodeId!)
                  setContextMenu(null)
                }}
              >
                Set as Start Node
              </button>
              <div style={{ borderTop: '1px solid #4a4a6a', margin: '2px 0' }} />
              <button
                style={{ ...menuItemStyle, color: '#f38ba8' }}
                onClick={() => {
                  store.deleteNode(contextMenu.nodeId!)
                  setContextMenu(null)
                }}
              >
                Delete Node
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '7px 14px',
  background: 'none',
  border: 'none',
  color: '#cdd6f4',
  fontSize: 13,
  textAlign: 'left',
  cursor: 'pointer'
}

export default function NarrativeCanvas({ narrativeId }: NarrativeCanvasProps) {
  return (
    <ReactFlowProvider>
      <NarrativeCanvasInner narrativeId={narrativeId} />
    </ReactFlowProvider>
  )
}
