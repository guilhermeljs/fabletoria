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
    sourcePosition,
    targetPosition,
    selected
  }: EdgeProps) => {
    const [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#6c63ff' : '#6b6b8e',
          strokeWidth: selected ? 2 : 1.5
        }}
      />
    )
  }
)

NodeEdge.displayName = 'NodeEdge'

export default NodeEdge
