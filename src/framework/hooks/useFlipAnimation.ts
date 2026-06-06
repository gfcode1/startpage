import { useRef, useLayoutEffect, type RefObject } from 'react'

export function useFlipAnimation(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  const positionsRef = useRef<Map<string, DOMRect>>(new Map())

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    const children = container.querySelectorAll<HTMLElement>('[data-flip-id]')
    const newPositions = new Map<string, DOMRect>()

    children.forEach(child => {
      const id = child.dataset.flipId
      if (!id) return

      const rect = child.getBoundingClientRect()
      const oldRect = positionsRef.current.get(id)
      newPositions.set(id, rect)

      if (oldRect) {
        const dx = oldRect.left - rect.left
        const dy = oldRect.top - rect.top
        if (dx !== 0 || dy !== 0) {
          child.animate?.([
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ], { duration: 300, easing: 'ease-out' })
        }
      } else {
        child.animate?.([
          { opacity: 0, transform: 'translateY(16px) scale(0.97)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], { duration: 250, easing: 'ease-out' })
      }
    })

    positionsRef.current = newPositions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
