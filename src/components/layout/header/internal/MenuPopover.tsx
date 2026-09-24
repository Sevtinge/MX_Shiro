'use client'

import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { RootPortal } from '~/components/ui/portal'
import { microReboundPreset } from '~/constants/spring'

import type { IHeaderMenu } from '../config'

export const MenuPopover: Component<{
  subMenu: IHeaderMenu['subMenu']
}> = memo(({ children, subMenu }) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

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
    setPosition({
      top: rect.bottom + 8,
      left: Math.max(
        12,
        Math.min(rect.left + rect.width / 2 - 75, window.innerWidth - 162),
      ),
    })
  }, [])
  const show = useCallback(() => {
    cancelClose()
    updatePosition()
    setOpen(true)
  }, [cancelClose, updatePosition])

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
              role="menu"
              className="fixed z-[99] flex w-[150px] flex-col overflow-hidden rounded-xl border border-zinc-900/5 bg-white/90 shadow-lg shadow-zinc-800/10 backdrop-blur-md dark:border-zinc-100/10 dark:bg-neutral-900/90"
              style={position}
              initial={{ y: 10, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{
                y: 8,
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.16 },
              }}
              transition={microReboundPreset}
              onMouseEnter={cancelClose}
              onMouseLeave={closeSoon}
              onFocusCapture={cancelClose}
              onBlurCapture={closeSoon}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false)
                  triggerRef.current?.querySelector('a')?.focus()
                }
              }}
            >
              {subMenu.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  role="menuitem"
                  className="relative flex items-center gap-2 px-4 py-3 text-sm duration-200 hover:bg-accent/5 hover:text-accent focus-visible:bg-accent/5 focus-visible:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.icon && (
                    <span className="flex shrink-0">{item.icon}</span>
                  )}
                  <span>{item.title}</span>
                </Link>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </>
  )
})
MenuPopover.displayName = 'MenuPopover'
