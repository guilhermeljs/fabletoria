import React, { useEffect, useRef, useState } from 'react'
import { BaseIcon } from './BaseIcon'
import type { ContextMenuItem } from '../../stores/context-menu-store'

export interface BaseContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export const BaseContextMenu: React.FC<BaseContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  // Adjust position so the menu never overflows the viewport
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: x + width > vw ? Math.max(0, x - width) : x,
      y: y + height > vh ? Math.max(0, y - height) : y,
    })
  }, [x, y])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on scroll outside the menu (keep open if scrolling inside)
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      onClose()
    }
    window.addEventListener('wheel', handler, { passive: true })
    return () => window.removeEventListener('wheel', handler)
  }, [onClose])

  // Close when the window loses focus (tab switch, alt+tab, etc.)
  useEffect(() => {
    window.addEventListener('blur', onClose)
    return () => window.removeEventListener('blur', onClose)
  }, [onClose])

  return (
    <>
      {/* Full-screen capture layer — swallows any pointer/touch/right-click outside the menu */}
      <div
        className="fixed inset-0 pointer-events-auto"
        onMouseDown={onClose}
        onTouchStart={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose() }}
      />

      <div
        ref={menuRef}
        className="fixed min-w-[160px] rounded-tk-md border border-border-main bg-bg-surface shadow-elevation-4 pointer-events-auto"
        style={{ top: pos.y, left: pos.x }}
      >
        {items.map((item, i) => {
          if (item.type === 'separator') {
            return <div key={i} className="my-tk-1 mx-tk-2 h-px bg-border-main" />
          }

          const isDanger = item.variant === 'danger'

          return (
            <button
              key={i}
              disabled={item.disabled}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { item.onClick(); onClose() }}
              className={`
                flex w-full items-center gap-tk-2 px-tk-2 py-tk-2 text-tk-sm
                transition-colors duration-100
                cursor-pointer
                disabled:pointer-events-none disabled:opacity-40
                ${isDanger
                  ? 'text-status-error hover:bg-status-error/10'
                  : 'text-text-main hover:bg-bg-header'
                }
              `.trim()}
            >
              {item.icon && (
                <BaseIcon
                  name={item.icon as Parameters<typeof BaseIcon>[0]['name']}
                  size={14}
                  className={`${isDanger ? 'text-status-error' : 'text-text-dim'}`}
                />
              )}
              {item.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
