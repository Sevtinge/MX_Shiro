'use client'

import type { DragEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

const EMOJIS = [
  '🎉',
  '🤡',
  '🎈',
  '🤪',
  '✨',
  '🐸',
  '🪩',
  '🌈',
  '💥',
  '🍭',
  '🥳',
  '😼',
  '🐣',
  '💀',
  '🪄',
]

type Shot = {
  id: string
  emoji: string
  originX: number
  originY: number
  startX: number
  startY: number
  vx: number
  vy: number
  size: number
  gravity: number
}

const FallingEmoji = ({
  shot,
  onDone,
}: {
  shot: Shot
  onDone: (id: string) => void
}) => {
  const [node, setNode] = useState<HTMLSpanElement | null>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!node) return
    let frame = 0
    let last = performance.now()
    let elapsed = 0
    let rotation = 0
    const spin = (Math.random() - 0.5) * 240

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      elapsed += dt
      const x = shot.startX + shot.vx * elapsed
      const y =
        shot.startY + shot.vy * elapsed + 0.5 * shot.gravity * elapsed * elapsed
      rotation += spin * dt
      node.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${rotation}deg)`

      const visualX = shot.originX + x
      const visualY = shot.originY + y
      const escaped =
        visualY > window.innerHeight + shot.size ||
        visualX < -shot.size * 2 ||
        visualX > window.innerWidth + shot.size * 2
      if (escaped || elapsed > 4) {
        onDoneRef.current(shot.id)
        return
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [
    node,
    shot.gravity,
    shot.id,
    shot.originX,
    shot.originY,
    shot.size,
    shot.startX,
    shot.startY,
    shot.vx,
    shot.vy,
  ])

  return (
    <span
      ref={setNode}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 select-none leading-none"
      style={{
        fontSize: shot.size,
        transform: `translate3d(calc(-50% + ${shot.startX}px), calc(-50% + ${shot.startY}px), 0)`,
      }}
    >
      {shot.emoji}
    </span>
  )
}

const preventDrag = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault()
}

export const AprilFoolsAvatarBurst = ({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) => {
  const [shots, setShots] = useState<Shot[]>([])

  const removeShot = (id: string) => {
    setShots((items) => items.filter((item) => item.id !== id))
  }

  const spawn = (event: MouseEvent<HTMLDivElement>) => {
    if (!active) return
    const rect = event.currentTarget.getBoundingClientRect()
    const page = Math.min(window.innerWidth, window.innerHeight)
    const narrow = window.innerWidth < 1024
    const size = Math.round(Math.min(52, Math.max(40, 34 + page * 0.018)))
    const radius = rect.width / 2
    const angle = Math.random() * Math.PI * 2
    const spawnRadius = radius * 0.9
    const centerX = rect.left + rect.width / 2
    const sideRoom = Math.min(centerX, window.innerWidth - centerX) - radius
    const travel = Math.min(
      Math.max(36, sideRoom) * 0.82,
      radius * (narrow ? 0.9 : 1.15),
    )
    const knee = narrow ? 0.2 : 0.24
    const speed = (travel / knee) * (0.9 + Math.random() * 0.2)
    const gravity = speed / knee
    setShots((items) => [
      ...items,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
        originX: centerX,
        originY: rect.top + rect.height / 2,
        startX: Math.cos(angle) * spawnRadius,
        startY: Math.sin(angle) * spawnRadius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        gravity,
      },
    ])
  }

  return (
    <div
      className={
        active
          ? 'relative size-full cursor-pointer select-none [&_img]:[-webkit-user-drag:none]'
          : 'relative size-full select-none [&_img]:[-webkit-user-drag:none]'
      }
      onClick={spawn}
      onDragStart={preventDrag}
    >
      {shots.map((shot) => (
        <FallingEmoji key={shot.id} shot={shot} onDone={removeShot} />
      ))}
      <div className="relative z-10 select-none">{children}</div>
    </div>
  )
}