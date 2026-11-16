import type {RefObject} from 'react';
import { useEffect } from 'react'

const scrollsOnY = (node: HTMLElement, deltaY: number) => {
  const { overflowY } = getComputedStyle(node)
  if (!/^(?:auto|scroll|overlay)$/.test(overflowY)) return false
  if (node.scrollHeight <= node.clientHeight + 1) return false
  if (deltaY < 0) return node.scrollTop > 0
  return node.scrollTop + node.clientHeight < node.scrollHeight - 1
}

/** Wheel over a header preview should move that preview, not the page. */
export const useLockPageScroll = (
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) => {
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return
    const onWheel = (event: WheelEvent) => {
      let current = event.target instanceof HTMLElement ? event.target : null
      while (current && current !== node) {
        if (scrollsOnY(current, event.deltaY)) return
        current = current.parentElement
      }
      if (!scrollsOnY(node, event.deltaY)) event.preventDefault()
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [enabled, ref])
}
