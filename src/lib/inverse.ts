import { Position } from '@xyflow/react'

export function InversePosition(position: Position | string): Position | null {
  const pos = typeof position === 'string' ? position.toLowerCase() : position

  return pos === Position.Left || pos === 'left'
    ? Position.Right
    : pos === Position.Right || pos === 'right'
      ? Position.Left
      : pos === Position.Top || pos === 'top'
        ? Position.Bottom
        : pos === Position.Bottom || pos === 'bottom'
          ? Position.Top
          : null
}