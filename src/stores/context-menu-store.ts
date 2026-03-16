import { create } from 'zustand'

export type ContextMenuItemVariant = 'default' | 'danger'

export interface ContextMenuActionItem {
  type?: 'action'
  label: string
  icon?: string
  variant?: ContextMenuItemVariant
  disabled?: boolean
  onClick: () => void
}

export interface ContextMenuSeparatorItem {
  type: 'separator'
}

export type ContextMenuItem = ContextMenuActionItem | ContextMenuSeparatorItem

export interface ContextMenuInstance {
  x: number
  y: number
  items: ContextMenuItem[]
}

interface ContextMenuState {
  active: ContextMenuInstance | null
  open: (x: number, y: number, items: ContextMenuItem[]) => void
  close: () => void
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  active: null,
  open: (x, y, items) => set({ active: { x, y, items } }),
  close: () => set({ active: null }),
}))
