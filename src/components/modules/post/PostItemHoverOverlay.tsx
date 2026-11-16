'use client'

import clsx from 'clsx'
import type { Transition } from 'motion/react'
import {
  AnimatePresence,
  m,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { useResetHover } from '~/hooks/common/use-reset-hover'

const highlightMotion = {
  initial: { opacity: 0.2, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const HoverHighlight = ({
  layoutId,
  active,
  className,
  transition,
  fade = false,
}: {
  layoutId?: string
  active: boolean
  className?: string
  transition?: Transition
  fade?: boolean
}) => {
  return (
    <AnimatePresence>
      {active && (
        <m.div
          layout={fade ? false : true}
          layoutId={fade ? undefined : layoutId}
          initial={fade ? { opacity: 0 } : highlightMotion.initial}
          animate={fade ? { opacity: 1 } : highlightMotion.animate}
          exit={fade ? { opacity: 0 } : highlightMotion.exit}
          transition={fade ? { duration: 0.18 } : transition}
          data-hover-highlight=""
          className={clsx('pointer-events-none absolute', className)}
        />
      )}
    </AnimatePresence>
  )
}

export const PostItemHoverOverlay = () => {
  const [mouseEnter, setMouseEnter] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useResetHover(setMouseEnter)
  useEffect(() => {
    const $ref = ref.current
    if (!$ref) return
    const $parent = $ref.parentElement
    if (!$parent) return
    $parent.onfocus = () => {
      setMouseEnter(true)
    }

    $parent.onblur = () => {
      setMouseEnter(false)
    }

    return () => {
      $parent.onfocus = null
      $parent.onblur = null
    }
  }, [])
  return (
    <>
      <div
        ref={ref}
        className="absolute inset-0 z-10"
        onMouseEnter={() => {
          setMouseEnter(true)
        }}
        onMouseLeave={() => {
          setMouseEnter(false)
        }}
      />

      <HoverHighlight
        layoutId="post-item-hover-overlay"
        active={mouseEnter}
        className="inset-0 z-[-1] rounded-2xl bg-accent/10 dark:bg-neutral-800 lg:-left-8 lg:-right-8"
      />
    </>
  )
}

export const PinnedPostGlow = () => {
  const ref = useRef<HTMLDivElement>(null)
  const localX = useMotionValue(0)
  const localY = useMotionValue(0)
  const background = useMotionTemplate`radial-gradient(560px circle at ${localX}px ${localY}px, var(--spotlight-color) 0%, transparent 68%)`

  useEffect(() => {
    const node = ref.current
    const parent = node?.parentElement
    if (!node || !parent) return
    const onMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect()
      localX.set(event.clientX - bounds.left)
      localY.set(event.clientY - bounds.top)
    }
    parent.addEventListener('pointermove', onMove)
    return () => parent.removeEventListener('pointermove', onMove)
  }, [localX, localY])

  return (
    <m.div
      ref={ref}
      aria-hidden
      data-pinned-glow=""
      className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 [--spotlight-color:oklch(var(--a)/0.1)] group-hover:opacity-100"
      style={{ background }}
    />
  )
}
