import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import type { TransitionEvent } from 'react'
import { useRef, useState } from 'react'

import { useEventCallback } from '~/hooks/common/use-event-callback'

export const sheetTransitionDuration = 500
export const sheetTransitionEase = 'cubic-bezier(0.32, 0.72, 0, 1)'

/** Retain the surface while CSS transitions reverse from their current position. */
export const useSheetTransition = (
  open: boolean,
  reducedMotion: boolean | null,
  onAnimationEnd?: (open: boolean) => void,
) => {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)
  const retained = useRef(false)
  const completed = useRef(false)
  const duration = reducedMotion ? 0 : sheetTransitionDuration
  const finish = useEventCallback(() => {
    if (completed.current) return
    completed.current = true
    if (!open) {
      retained.current = false
      setMounted(false)
    }
    onAnimationEnd?.(open)
  })

  useIsomorphicLayoutEffect(() => {
    if (!open && !retained.current) return
    completed.current = false
    let firstFrame = 0
    let secondFrame = 0
    if (open) {
      setMounted(true)
      if (retained.current || reducedMotion) setEntered(true)
      else {
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => setEntered(true))
        })
      }
      retained.current = true
    } else setEntered(false)

    // Also complete when reduced motion or an interrupted transition emits no event.
    const timeout = setTimeout(finish, duration + 64)
    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      clearTimeout(timeout)
    }
  }, [open, duration, reducedMotion, finish])

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === 'transform'
    )
      finish()
  }

  return {
    mounted: mounted || open,
    entered: entered && open,
    duration,
    onTransitionEnd,
  }
}
