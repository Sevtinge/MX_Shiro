'use client'

import { AnimatePresence, m, useMotionTemplate, useMotionValue } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { RootPortal } from '~/components/ui/portal'
import { clsxm } from '~/lib/helper'

import type { IHeaderMenu } from '../config'
import { useLockPageScroll } from './use-lock-page-scroll'

export const MenuPopover: Component<{
  subMenu: IHeaderMenu['subMenu']
}> = memo(({ children, subMenu }) => {
  const pathname = usePathname()
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [indicator, setIndicator] = useState<{
    top: number
    height: number
  } | null>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(120)
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, var(--spotlight-color) 0%, transparent 65%)`

  const currentPath =
    subMenu?.find((item) => item.path === pathname)?.path ?? null
  const markedPath = hoveredPath ?? currentPath

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const closeSoon = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }, [cancelClose])
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 200
    const preferredLeft = rect.left + rect.width / 2 - width / 2
    setPosition({
      top: rect.bottom + 10,
      left: Math.max(
        12,
        Math.min(preferredLeft, window.innerWidth - width - 12),
      ),
    })
  }, [])
  const show = useCallback(() => {
    cancelClose()
    updatePosition()
    setOpen(true)
  }, [cancelClose, updatePosition])
  const measureIndicator = useCallback(() => {
    const panel = panelRef.current
    const activeRow = panel?.querySelector<HTMLElement>(
      '[data-section-active="true"]',
    )
    if (!panel || !activeRow) {
      setIndicator(null)
      return
    }
    const panelBox = panel.getBoundingClientRect()
    const rowBox = activeRow.getBoundingClientRect()
    const inset = 8
    setIndicator({
      top: rowBox.top - panelBox.top + inset,
      height: Math.max(rowBox.height - inset * 2, 8),
    })
  }, [])

  useLockPageScroll(panelRef, open)
  useEffect(() => cancelClose, [cancelClose])
  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])
  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    measureIndicator()
  }, [open, markedPath, measureIndicator, updatePosition])

  if (!subMenu?.length) return children

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={show}
        onMouseLeave={closeSoon}
        onFocusCapture={show}
        onBlurCapture={closeSoon}
      >
        {children}
      </div>
      <RootPortal>
        <AnimatePresence>
          {open && (
            <m.div
              ref={panelRef}
              role="menu"
              className="group fixed z-[99] overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50/85 to-white/95 py-3 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md [--spotlight-color:oklch(var(--a)_/_0.12)] dark:from-zinc-900/85 dark:to-zinc-800/95 dark:ring-zinc-100/10"
              style={{ ...position, width: 200 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6, transition: { duration: 0.16 } }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={() => {
                setHoveredPath(null)
                closeSoon()
              }}
              onFocusCapture={cancelClose}
              onBlurCapture={closeSoon}
              onMouseMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect()
                mouseX.set(event.clientX - bounds.left)
                mouseY.set(event.clientY - bounds.top)
                radius.set(Math.hypot(bounds.width, bounds.height) / 2.5)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false)
                  triggerRef.current?.querySelector('a')?.focus()
                }
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <m.div
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background }}
                  aria-hidden="true"
                />
              </div>
              {indicator && (
                <m.span
                  aria-hidden
                  className="pointer-events-none absolute right-0 z-10 w-px bg-gradient-to-b from-accent/0 via-accent/70 to-accent/0"
                  initial={false}
                  animate={{ top: indicator.top, height: indicator.height }}
                  transition={{
                    type: 'spring',
                    stiffness: 680,
                    damping: 32,
                    mass: 0.35,
                  }}
                />
              )}
              <ul className="relative">
                {subMenu.map((item) => {
                  const active = item.path === markedPath
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        role="menuitem"
                        data-section-active={active ? 'true' : undefined}
                        className={clsxm(
                          'relative flex items-center gap-3 px-5 py-2 text-sm transition-colors',
                          active
                            ? 'text-accent'
                            : 'text-zinc-800 hover:text-accent/80 dark:text-zinc-200',
                        )}
                        onMouseEnter={() => setHoveredPath(item.path)}
                        onFocus={() => setHoveredPath(item.path)}
                        onClick={() => setOpen(false)}
                      >
                        {item.icon && (
                          <span className="flex shrink-0 items-center justify-center">
                            {item.icon}
                          </span>
                        )}
                        <span className="min-w-0 truncate">{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </>
  )
})
MenuPopover.displayName = 'MenuPopover'
