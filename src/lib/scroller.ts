'use client'

import type { Transition } from 'motion/react'
import { animateValue } from 'motion/react'

import {
  advanceScrollTowardTarget,
  getElementDocumentTop,
} from './scroller-position'

const spring: Transition = {
  type: 'spring',
  stiffness: 1000,
  damping: 250,
}
// TODO scroller lock
export const springScrollTo = (y: number) => {
  const scrollTop =
    // FIXME latest version framer will ignore keyframes value `0`
    document.documentElement.scrollTop || document.body.scrollTop

  const stopSpringScrollHandler = () => {
    animation.stop()
  }
  const animation = animateValue({
    keyframes: [scrollTop + 1, y],
    autoplay: true,
    ...spring,
    onPlay() {
      window.addEventListener('wheel', stopSpringScrollHandler)
      window.addEventListener('touchmove', stopSpringScrollHandler)
    },

    onUpdate(latest) {
      if (latest <= 0) {
        animation.stop()
      }
      window.scrollTo(0, latest)
    },
  })

  animation.then(() => {
    window.removeEventListener('wheel', stopSpringScrollHandler)
    window.removeEventListener('touchmove', stopSpringScrollHandler)
  })
  return animation
}

export const springScrollToTop = () => {
  return springScrollTo(0)
}

interface ElementScrollOptions {
  followLayout?: boolean
}

export const springScrollToElement = (
  element: HTMLElement,
  delta = 40,
  options: ElementScrollOptions = {},
) => {
  if (!options.followLayout) {
    return springScrollTo(
      getElementDocumentTop(
        element.getBoundingClientRect().top,
        window.scrollY,
      ) + delta,
    )
  }

  return springScrollToElementFollowingLayout(element, delta)
}

let cancelActiveElementScroll: (() => void) | null = null

const springScrollToElementFollowingLayout = (
  element: HTMLElement,
  delta: number,
) => {
  cancelActiveElementScroll?.()

  let motion = { position: window.scrollY, velocity: 0 }
  let lastFrame = 0
  let frame = 0
  let cancelled = false
  let settled = false
  let settleInterval: ReturnType<typeof setInterval> | undefined
  let finish!: () => void
  const finished = new Promise<void>((resolve) => {
    finish = resolve
  })

  const getTarget = () =>
    element.isConnected ? element : document.getElementById(element.id)
  const getDesiredScroll = () => {
    const target = getTarget()
    if (!target) return null
    return Math.max(
      0,
      Math.min(
        getElementDocumentTop(
          target.getBoundingClientRect().top,
          window.scrollY,
        ) + delta,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    )
  }
  const stopOnKey = (event: KeyboardEvent) => {
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
    ) {
      cancel()
    }
  }
  const cleanup = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchmove', cancel)
    window.removeEventListener('pointerdown', cancel)
    window.removeEventListener('keydown', stopOnKey)
    if (settleInterval) clearInterval(settleInterval)
    clearTimeout(timeout)
    if (cancelActiveElementScroll === cancel) cancelActiveElementScroll = null
  }
  const cancel = () => {
    if (cancelled) return
    cancelled = true
    cleanup()
  }

  const onFrame = (time: number) => {
    if (cancelled) return
    const desired = getDesiredScroll()
    if (desired === null) {
      cancel()
      return
    }

    // Browser scroll anchoring can move the viewport while blocks load.
    if (Math.abs(window.scrollY - motion.position) > 3) {
      motion = { position: window.scrollY, velocity: 0 }
    }
    const dt = lastFrame ? (time - lastFrame) / (1000 / 60) : 1
    lastFrame = time
    motion = advanceScrollTowardTarget(motion, desired, dt)
    window.scrollTo(0, motion.position)

    if (
      Math.abs(window.scrollY - desired) < 2 &&
      Math.abs(motion.velocity) < 0.4
    ) {
      if (!settled) {
        settled = true
        finish()
      }
      // Poll briefly for late image/code layout changes, then resume smoothly.
      settleInterval = setInterval(() => {
        const next = getDesiredScroll()
        if (next === null) {
          cancel()
        } else if (Math.abs(next - window.scrollY) > 3) {
          clearInterval(settleInterval)
          settleInterval = undefined
          motion = { position: window.scrollY, velocity: 0 }
          lastFrame = 0
          frame = requestAnimationFrame(onFrame)
        }
      }, 100)
      return
    }
    frame = requestAnimationFrame(onFrame)
  }

  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchmove', cancel, { passive: true })
  window.addEventListener('pointerdown', cancel, { passive: true })
  window.addEventListener('keydown', stopOnKey)
  cancelActiveElementScroll = cancel
  frame = requestAnimationFrame(onFrame)
  const timeout = setTimeout(() => {
    if (!settled && !cancelled) finish()
    cleanup()
  }, 5000)

  return finished
}
