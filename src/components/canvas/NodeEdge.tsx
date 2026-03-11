import { memo } from 'react'
import {
  BaseEdge,
  getStraightPath,
  type EdgeProps
} from '@xyflow/react'

const NodeEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    selected
  }: EdgeProps) => {
    const [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })

    return (
      <>
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" stroke={selected ? '#6c63ff' : '#6b6b8e'} />
            </marker>
          </defs>
        </svg>

        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: selected ? '#6c63ff' : '#6b6b8e',
            strokeWidth: selected ? 2 : 1.5
          }}
          markerEnd="url(#arrow)"
        />
      </>
    )
  }
)

NodeEdge.displayName = 'NodeEdge'

export default NodeEdge