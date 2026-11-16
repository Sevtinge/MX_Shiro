'use client'

import { AnimatePresence, m, useIsPresent } from 'motion/react'
import type { ReactNode } from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

import { RootPortal } from '~/components/ui/portal'

import type { IHeaderMenu } from '../config'
import type { NavPreviewKind } from './nav-preview-context'
import { NavPreviewContext } from './nav-preview-context'
import { NotesMenuPopover } from './NotesMenuPopover'
import { PostsMenuPopover } from './PostsMenuPopover'
import { TimelineMenuPopover } from './TimelineMenuPopover'
import { useLockPageScroll } from './use-lock-page-scroll'

const moveTransition =
  'left .25s cubic-bezier(.4,0,.2,1), top .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1), height .25s cubic-bezier(.4,0,.2,1)'

type ActivePreview = {
  kind: NavPreviewKind
  section: IHeaderMenu
  anchor: HTMLElement
  direction: -1 | 0 | 1
}

const place = (anchor: HTMLElement, width: number) => {
  const rect = anchor.getBoundingClientRect()
  const used = Math.min(Math.max(width, 1), window.innerWidth - 24)
  const left = Math.max(
    12,
    Math.min(
      rect.left + rect.width / 2 - used / 2,
      window.innerWidth - used - 12,
    ),
  )
  return { top: rect.bottom + 10, left, width: used }
}

export const NavPreviewProvider: Component = ({ children }) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasOpen = useRef(false)
  const kindRef = useRef<NavPreviewKind | null>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef({ width: 0, height: 0 })
  const [active, setActive] = useState<ActivePreview | null>(null)
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 })
  const [height, setHeight] = useState(0)

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const close = useCallback(() => {
    cancelClose()
    kindRef.current = null
    anchorRef.current = null
    wasOpen.current = false
    targetRef.current = { width: 0, height: 0 }
    setActive(null)
  }, [cancelClose])
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      kindRef.current = null
      anchorRef.current = null
      wasOpen.current = false
      targetRef.current = { width: 0, height: 0 }
      setActive(null)
    }, 180)
  }, [cancelClose])
  const applySize = useCallback((token: string, width: number, nextHeight: number) => {
    if (kindRef.current !== token || width <= 0 || nextHeight <= 0) return
    const previous = targetRef.current
    if (
      Math.abs(previous.width - width) < 1 &&
      Math.abs(previous.height - nextHeight) < 1
    ) {
      return
    }
    targetRef.current = { width, height: nextHeight }
    const anchor = anchorRef.current
    const shell = shellRef.current
    const visual = shell?.getBoundingClientRect()
    const canAnimate =
      wasOpen.current &&
      !!shell &&
      !!visual &&
      visual.width > 1 &&
      visual.height > 1
    if (!canAnimate || !anchor || !shell || !visual) {
      wasOpen.current = true
      if (anchor) setBox(place(anchor, width))
      setHeight(nextHeight)
      return
    }
    // Restart from the pixels currently on screen, then transition to the
    // latest content. A fast second switch no longer keeps the previous target.
    shell.style.transition = 'none'
    shell.style.width = `${visual.width}px`
    shell.style.height = `${visual.height}px`
    shell.style.left = `${visual.left}px`
    shell.style.top = `${visual.top}px`
    void shell.offsetWidth
    const placed = place(anchor, width)
    shell.style.transition = moveTransition
    shell.style.width = `${placed.width}px`
    shell.style.height = `${nextHeight}px`
    shell.style.left = `${placed.left}px`
    shell.style.top = `${placed.top}px`
    setBox(placed)
    setHeight(nextHeight)
  }, [])
  const show = useCallback(
    (kind: NavPreviewKind, section: IHeaderMenu, anchor: HTMLElement) => {
      cancelClose()
      kindRef.current = kind
      anchorRef.current = anchor
      setBox((current) => place(anchor, current.width || widthFromAnchor()))
      setActive((current) => {
        const direction =
          !current || current.anchor === anchor
            ? 0
            : anchor.getBoundingClientRect().left >
                current.anchor.getBoundingClientRect().left
              ? 1
              : -1
        return { kind, section, anchor, direction }
      })
    },
    [cancelClose],
  )

  useEffect(() => cancelClose, [cancelClose])
  useEffect(() => {
    if (!active) return
    const update = (event: Event) => {
      const anchor = anchorRef.current
      if (!anchor) return
      // Scrolling the article list should not reposition the panel.
      if (
        event.target instanceof Node &&
        shellRef.current?.contains(event.target)
      ) {
        return
      }
      setBox((current) => place(anchor, current.width))
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active])

  useLockPageScroll(shellRef, !!active)
  const switching = wasOpen.current && !!active

  return (
    <NavPreviewContext.Provider
      value={{ show, scheduleClose, cancelClose, close }}
    >
      {children}
      <RootPortal>
        <AnimatePresence>
          {active && (
            <m.div
              key="shared-nav-preview"
              ref={shellRef}
              role="presentation"
              className="overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50/85 to-white/95 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/85 dark:to-zinc-800/95 dark:ring-zinc-100/10"
              style={{
                position: 'fixed',
                zIndex: 99,
                top: box.top,
                left: box.left,
                width: box.width || undefined,
                height: height || undefined,
                transition: switching ? moveTransition : undefined,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6, transition: { duration: 0.16 } }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div className="relative">
                <AnimatePresence initial={false} custom={active.direction}>
                  <PreviewLayer
                    key={active.kind}
                    token={active.kind}
                    direction={active.direction}
                    onSize={applySize}
                  >
                    {active.kind === 'post' && (
                      <PostsMenuPopover
                        embedded
                        subMenu={active.section.subMenu}
                      />
                    )}
                    {active.kind === 'note' && <NotesMenuPopover embedded />}
                    {active.kind === 'timeline' && (
                      <TimelineMenuPopover embedded />
                    )}
                  </PreviewLayer>
                </AnimatePresence>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </NavPreviewContext.Provider>
  )
}

const widthFromAnchor = () => 456

const PreviewLayer = ({
  children,
  token,
  direction,
  onSize,
}: {
  children: ReactNode
  token: string
  direction: -1 | 0 | 1
  onSize: (token: string, width: number, height: number) => void
}) => {
  const present = useIsPresent()
  const ref = useRef<HTMLDivElement>(null)
  const onSizeRef = useRef(onSize)
  onSizeRef.current = onSize
  useLayoutEffect(() => {
    if (!present) return
    const element = ref.current
    if (!element) return
    const report = () => {
      onSizeRef.current(token, element.offsetWidth, element.offsetHeight)
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(element)
    return () => observer.disconnect()
  }, [present, token])
  return (
    <m.div
      ref={ref}
      className={present ? 'relative w-max' : 'absolute left-0 top-0 w-max'}
      initial={{ opacity: 0, x: direction === 0 ? 0 : direction * 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction === 0 ? 0 : direction * -12 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </m.div>
  )
}
