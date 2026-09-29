'use client'

import { useEffect, useRef } from 'react'

import { advanceGlowSpring, clampGlow } from '~/lib/hero-glow-physics'

import styles from './HeroGlow.module.css'

export const HeroGlow = () => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const nearGlowRef = useRef<HTMLDivElement>(null)
  const farGlowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const nearGlow = nearGlowRef.current
    const farGlow = farGlowRef.current
    if (!scene || !nearGlow || !farGlow) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    let visible = false
    let frame = 0
    let lastFrame = 0
    let lastScrollY = window.scrollY
    let pointerX = 0
    let pointerY = 0
    let scrollImpulseY = 0
    let x = { position: 0, velocity: 0 }
    let y = { position: 0, velocity: 0 }

    const schedule = () => {
      if (!frame && visible && !document.hidden && !reducedMotion.matches) {
        frame = requestAnimationFrame(animate)
      }
    }

    const animate = (time: number) => {
      frame = 0
      const dt = lastFrame
        ? clampGlow((time - lastFrame) / (1000 / 60), 0, 2)
        : 1
      lastFrame = time

      scrollImpulseY *= Math.pow(0.95, dt)
      x = advanceGlowSpring(x, pointerX, dt)
      y = advanceGlowSpring(y, pointerY + scrollImpulseY, dt)

      nearGlow.style.transform = `translate3d(${x.position.toFixed(2)}px, ${y.position.toFixed(2)}px, 0)`
      farGlow.style.transform = `translate3d(${(-x.position * 0.65).toFixed(2)}px, ${(-y.position * 0.4).toFixed(2)}px, 0)`

      if (
        Math.abs(x.position - pointerX) > 0.08 ||
        Math.abs(y.position - pointerY) > 0.08 ||
        Math.abs(x.velocity) > 0.08 ||
        Math.abs(y.velocity) > 0.08 ||
        Math.abs(scrollImpulseY) > 0.08
      ) {
        schedule()
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const bounds = scene.getBoundingClientRect()
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        onPointerLeave()
        return
      }
      pointerX = clampGlow(
        (event.clientX / window.innerWidth - 0.5) * 340,
        -170,
        170,
      )
      pointerY = clampGlow(
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 180,
        -90,
        90,
      )
      schedule()
    }

    const onPointerLeave = () => {
      pointerX = 0
      pointerY = 0
      schedule()
    }

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onPointerLeave()
    }

    const onScroll = () => {
      const { scrollY } = window
      const delta = scrollY - lastScrollY
      lastScrollY = scrollY
      if (!visible) return

      // The light lags behind the surface before settling back into place.
      scrollImpulseY = clampGlow(scrollImpulseY - delta * 0.85, -190, 190)
      schedule()
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
        lastFrame = 0
      } else {
        lastScrollY = window.scrollY
        schedule()
      }
    }

    const onReducedMotionChange = () => {
      if (reducedMotion.matches) {
        cancelAnimationFrame(frame)
        frame = 0
        nearGlow.style.transform = ''
        farGlow.style.transform = ''
      } else {
        lastFrame = 0
        schedule()
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        lastScrollY = window.scrollY
        if (visible) {
          schedule()
        } else {
          cancelAnimationFrame(frame)
          frame = 0
          lastFrame = 0
          scrollImpulseY = 0
        }
      },
      { rootMargin: '80px' },
    )

    observer.observe(scene)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerOut)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    reducedMotion.addEventListener('change', onReducedMotionChange)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reducedMotion.removeEventListener('change', onReducedMotionChange)
    }
  }, [])

  return (
    <div aria-hidden="true" className={styles.scene} ref={sceneRef}>
      <div className={styles.ambient} />
      <div className={styles.nearMotion} ref={nearGlowRef}>
        <div className={styles.nearGlow} />
      </div>
      <div className={styles.farMotion} ref={farGlowRef}>
        <div className={styles.farGlow} />
      </div>
    </div>
  )
}
