'use client'

import { useEffect } from 'react'

import { MAIN_MARKDOWN_ID } from '~/constants/dom-id'
import {
  advanceWheelScroll,
  isLongformPath,
  wheelDeltaToPixels,
} from '~/lib/wheel-inertia'

const hasScrollableAncestor = (target: EventTarget | null) => {
  let element = target instanceof Element ? target : null
  while (element && element !== document.body) {
    const { overflowY } = getComputedStyle(element)
    if (
      /^(?:auto|scroll|overlay)$/.test(overflowY) &&
      element.scrollHeight > element.clientHeight + 1
    )
      return true
    element = element.parentElement
  }
  return false
}

const isReadingPage = () =>
  isLongformPath(window.location.pathname) ||
  !!document.getElementById(MAIN_MARKDOWN_ID)

/** Smooth only conventional mouse-wheel steps on non-reading pages. */
export const InertialWheelScroll = () => {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let lastFrame = 0
    let current = window.scrollY
    let lastWritten = current
    let target = current

    const cancel = () => {
      cancelAnimationFrame(frame)
      frame = 0
      lastFrame = 0
      current = target = lastWritten = window.scrollY
    }
    const tick = (time: number) => {
      if (
        document.hidden ||
        isReadingPage() ||
        Math.abs(window.scrollY - lastWritten) > 3
      ) {
        cancel()
        return
      }
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      target = Math.min(max, Math.max(0, target))
      current = advanceWheelScroll(current, target, time - lastFrame)
      lastFrame = time
      const finished = Math.abs(current - target) < 0.6
      if (finished) current = target
      if (finished || Math.abs(current - lastWritten) >= 0.5) {
        window.scrollTo({ top: current, behavior: 'instant' })
        lastWritten = window.scrollY
      }
      if (finished) {
        cancel()
      } else {
        frame = requestAnimationFrame(tick)
      }
    }

    const onWheel = (event: WheelEvent) => {
      const delta = wheelDeltaToPixels(
        event.deltaY,
        event.deltaMode,
        window.innerHeight,
      )
      if (
        event.defaultPrevented ||
        !event.cancelable ||
        reducedMotion.matches ||
        isReadingPage() ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.deltaX !== 0 ||
        !event.deltaY ||
        document.hidden ||
        // Fine, fractional touchpad deltas already have native momentum.
        (event.deltaMode === 0 &&
          (Math.abs(event.deltaY) < 40 || !Number.isInteger(event.deltaY))) ||
        hasScrollableAncestor(event.target) ||
        (event.target instanceof Element &&
          !!event.target.closest(
            'input, textarea, select, [contenteditable], [role="slider"], [role="dialog"], [data-no-smooth-scroll]',
          )) ||
        ['hidden', 'clip'].includes(
          getComputedStyle(document.body).overflowY,
        ) ||
        ['hidden', 'clip'].includes(
          getComputedStyle(document.documentElement).overflowY,
        )
      ) {
        cancel()
        return
      }

      const current = window.scrollY
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      if ((delta < 0 && current <= 0) || (delta > 0 && current >= max)) {
        cancel()
        return
      }

      event.preventDefault()
      if (!frame) {
        target = current
        lastWritten = current
        lastFrame = performance.now()
      }
      // Reversing direction should not first travel through pending momentum.
      if ((target - current) * delta < 0) target = current
      target = Math.min(max, Math.max(0, target + delta))
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'PageUp',
          'PageDown',
          'Home',
          'End',
          ' ',
        ].includes(event.key)
      )
        cancel()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('pointerdown', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    reducedMotion.addEventListener('change', cancel)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointerdown', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', onKeyDown)
      reducedMotion.removeEventListener('change', cancel)
      cancel()
    }
  }, [])

  return null
}
