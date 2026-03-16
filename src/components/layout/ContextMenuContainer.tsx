import React from 'react'
import { useContextMenuStore } from '../../stores/context-menu-store'
import { BaseContextMenu } from '../primitives/BaseContextMenu'
import { ContextMenuPortal } from './PortalProvider'

export const ContextMenuContainer: React.FC = () => {
  const { active, close } = useContextMenuStore()

  if (!active) return null

  return (
    <ContextMenuPortal>
      <BaseContextMenu x={active.x} y={active.y} items={active.items} onClose={close} />
    </ContextMenuPortal>
  )
}
