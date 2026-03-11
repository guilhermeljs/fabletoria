import { useRef, useState } from 'react'

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/markdown'
])

export function useAssetDrop(onDrop: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const dragDepth = useRef(0)

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current++
    if (dragDepth.current === 1) setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current--
    if (dragDepth.current === 0) setIsDragging(false)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const onDropEvent = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => ACCEPTED_TYPES.has(f.type)
    )
    if (files.length > 0) onDrop(files)
  }

  return {
    isDragging,
    dropProps: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop: onDropEvent
    }
  }
}
