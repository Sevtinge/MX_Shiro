'use client'

import clsx from 'clsx'
import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'

import { useSkipHomeEntrance } from '~/atoms/home-entrance'

import styles from './HeaderEntrance.module.css'
import { getHeaderBgScrollStart } from './scroll-threshold'

export const HeaderEntrance = ({ children }: PropsWithChildren) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const hasEvaluated = useRef(false)
  const floatingUntil = useRef(0)
  const skipHomeEntrance = useSkipHomeEntrance()
  const pathname = usePathname()

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Fast Refresh may re-apply the initial class to an already mounted header.
    element.classList.remove(styles.pending)
    if (hasEvaluated.current) return
    hasEvaluated.current = true
    floatingUntil.current = getHeaderBgScrollStart(pathname, window.innerHeight)

    if (
      pathname !== '/' ||
      skipHomeEntrance ||
      window.scrollY >= floatingUntil.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    element.classList.add(styles.enter)
  }, [pathname, skipHomeEntrance])

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY >= floatingUntil.current) {
        elementRef.current?.classList.remove(styles.enter)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={elementRef}
      className={clsx(
        'relative z-[1] h-full',
        pathname === '/' && !skipHomeEntrance && styles.pending,
      )}
    >
      {children}
    </div>
  )
}
