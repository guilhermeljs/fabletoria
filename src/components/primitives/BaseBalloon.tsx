import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TooltipPortal } from '../layout/PortalProvider'
import { BaseButton } from './BaseButton'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface BaseBalloonProps {
  /** Whether the balloon is visible */
  isOpen: boolean
  /** Main message shown inside the balloon */
  message: React.ReactNode
  /** Optional title shown above the message */
  title?: React.ReactNode
  /** Which side the balloon should appear on */
  placement?: Placement
  /** Extra distance between anchor and balloon */
  distance?: number
  /** Callback called when the user clicks the Ok button */
  onClose: () => void
  /** Content that will act as the anchor (parent container) */
  children?: React.ReactNode
  /** Additional class name for the anchor wrapper */
  wrapperClassName?: string
  className?: string
}

const ARROW_SIZE = 10
const MIN_GAP = 8

export const BaseBalloon: React.FC<BaseBalloonProps> = ({
  isOpen,
  message,
  title,
  placement = 'top',
  distance = 16,
  onClose,
  children,
  wrapperClassName = '',
  className = ''
}) => {
  const anchorRef = useRef<HTMLElement | null>(null)
  const balloonRef = useRef<HTMLDivElement | null>(null)

  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})
  const [currentPlacement, setCurrentPlacement] = useState<Placement>(placement)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const balloon = balloonRef.current
    if (!anchor || !balloon) return

    const gap = distance

    const anchorRect = anchor.getBoundingClientRect()
    const balloonRect = balloon.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const computePosition = (placementToUse: Placement) => {
      let top = 0
      let left = 0

      switch (placementToUse) {
        case 'top':
          top = anchorRect.top - balloonRect.height - gap
          left = anchorRect.left + anchorRect.width / 2 - balloonRect.width / 2
          break
        case 'bottom':
          top = anchorRect.bottom + gap
          left = anchorRect.left + anchorRect.width / 2 - balloonRect.width / 2
          break
        case 'left':
          top = anchorRect.top + anchorRect.height / 2 - balloonRect.height / 2
          left = anchorRect.left - balloonRect.width - gap
          break
        case 'right':
          top = anchorRect.top + anchorRect.height / 2 - balloonRect.height / 2
          left = anchorRect.right + gap
          break
      }

      top = Math.max(MIN_GAP, Math.min(top, viewportHeight - balloonRect.height - MIN_GAP))
      left = Math.max(MIN_GAP, Math.min(left, viewportWidth - balloonRect.width - MIN_GAP))

      return { top, left }
    }

    const safePlacement = placement
    let pos = computePosition(safePlacement)

    const isOffscreen =
      pos.top < MIN_GAP ||
      pos.left < MIN_GAP ||
      pos.top + balloonRect.height > viewportHeight - MIN_GAP ||
      pos.left + balloonRect.width > viewportWidth - MIN_GAP

    if (isOffscreen) {
      const flipped: Record<Placement, Placement> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left'
      }

      const altPlacement = flipped[safePlacement]
      const altPos = computePosition(altPlacement)

      const altOffscreen =
        altPos.top < MIN_GAP ||
        altPos.left < MIN_GAP ||
        altPos.top + balloonRect.height > viewportHeight - MIN_GAP ||
        altPos.left + balloonRect.width > viewportWidth - MIN_GAP

      if (!altOffscreen) {
        pos = altPos
        if (currentPlacement !== altPlacement) setCurrentPlacement(altPlacement)
      } else if (currentPlacement !== safePlacement) {
        setCurrentPlacement(safePlacement)
      }
    } else if (currentPlacement !== safePlacement) {
      setCurrentPlacement(safePlacement)
    }

    const arrowLeft = Math.min(
      Math.max(anchorRect.left + anchorRect.width / 2 - pos.left - ARROW_SIZE / 2, MIN_GAP),
      balloonRect.width - ARROW_SIZE - MIN_GAP
    )

    const arrowTop = Math.min(
      Math.max(anchorRect.top + anchorRect.height / 2 - pos.top - ARROW_SIZE / 2, MIN_GAP),
      balloonRect.height - ARROW_SIZE - MIN_GAP
    )

    setPosition(pos)
    setArrowStyle({ left: arrowLeft, top: arrowTop })
  }, [currentPlacement, distance, placement])

  const setBalloonRef = useCallback(
    (el: HTMLDivElement | null) => {
      balloonRef.current = el
      if (el) updatePosition()
    },
    [updatePosition]
  )

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(null)
      return
    }

    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    const anchor = anchorRef.current
    let observer: ResizeObserver | null = null

    if (anchor) {
      observer = new ResizeObserver(() => updatePosition())
      observer.observe(anchor)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
      observer?.disconnect()
    }
  }, [isOpen, updatePosition])

  return (
    <>
      <span ref={anchorRef} className={`inline-flex ${wrapperClassName}`}>
        {children}
      </span>

      {isOpen && (
        <TooltipPortal>
          <div
            ref={setBalloonRef}
            className={`pointer-events-auto absolute z-[3100] ${className}`}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden'
            }}
            role="dialog"
            aria-modal="false"
          >
            <div className="relative rounded-tk-md border border-brand-primary bg-bg-surface p-tk-3 shadow-elevation-4 text-text-main w-max max-w-[min(280px,calc(100vw-32px))]">
              {title &&
                (typeof title === 'string' ? (
                  <div className="mb-tk-2 font-semibold text-tk-sm">{title}</div>
                ) : (
                  <div className="mb-tk-2">{title}</div>
                ))}
              {typeof message === 'string' ? <div className="text-tk-sm">{message}</div> : message}

              <div className="mt-tk-2 flex justify-end">
                <BaseButton size="sm" variant="ghost" onClick={onClose}>
                  Ok
                </BaseButton>
              </div>

              <div
                className="absolute  bg-bg-surface border-brand-primary border-t border-l rotate-45"
                style={{
                  width: ARROW_SIZE,
                  height: ARROW_SIZE,
                  ...arrowStyle,
                  ...(currentPlacement === 'top' && { bottom: -ARROW_SIZE / 2 }),
                  ...(currentPlacement === 'bottom' && { top: -ARROW_SIZE / 2 }),
                  ...(currentPlacement === 'left' && { right: -ARROW_SIZE / 2 }),
                  ...(currentPlacement === 'right' && { left: -ARROW_SIZE / 2 })
                }}
              />
            </div>
          </div>
        </TooltipPortal>
      )}
    </>
  )
}
