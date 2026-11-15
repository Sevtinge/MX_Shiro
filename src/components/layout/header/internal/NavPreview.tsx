'use client'

import { AnimatePresence, m } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { RootPortal } from '~/components/ui/portal'

import type { IHeaderMenu } from '../config'
import { NotesMenuPopover } from './NotesMenuPopover'
import { PostsMenuPopover } from './PostsMenuPopover'
import { TimelineMenuPopover } from './TimelineMenuPopover'
import { NavPreviewContext, type NavPreviewKind } from './nav-preview-context'

const panelWidth = 720
const moveTransition =
  'left .25s cubic-bezier(.4,0,.2,1), top .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1), height .25s cubic-bezier(.4,0,.2,1)'

type ActivePreview = {
  kind: NavPreviewKind
  section: IHeaderMenu
  anchor: HTMLElement
  direction: -1 | 0 | 1
}

const place = (anchor: HTMLElement) => {
  const rect = anchor.getBoundingClientRect()
  const width = Math.min(panelWidth, window.innerWidth - 24)
  const left = Math.max(
    12,
    Math.min(
      rect.left + rect.width / 2 - width / 2,
      window.innerWidth - width - 12,
    ),
  )
  return { top: rect.bottom + 10, left, width }
}

export const NavPreviewProvider: Component = ({ children }) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasOpen = useRef(false)
  const [active, setActive] = useState<ActivePreview | null>(null)
  const [box, setBox] = useState({ top: 0, left: 0, width: panelWidth })
  const [height, setHeight] = useState(0)

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const close = useCallback(() => {
    cancelClose()
    setActive(null)
  }, [cancelClose])
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setActive(null), 180)
  }, [cancelClose])
  const show = useCallback(
    (kind: NavPreviewKind, section: IHeaderMenu, anchor: HTMLElement) => {
      cancelClose()
      const next = place(anchor)
      setBox(next)
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
    const update = () => setBox(place(active.anchor))
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active])

  const switching = wasOpen.current && !!active
  useEffect(() => {
    wasOpen.current = !!active
  }, [active])

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
              role="presentation"
              className="overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50/85 to-white/95 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/85 dark:to-zinc-800/95 dark:ring-zinc-100/10"
              style={{
                position: 'fixed',
                zIndex: 99,
                top: box.top,
                left: box.left,
                width: box.width,
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
                  <m.div
                    key={active.kind}
                    className="absolute inset-x-0 top-0 w-full"
                    initial={{
                      opacity: 0,
                      x: active.direction === 0 ? 0 : active.direction * 12,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: active.direction === 0 ? 0 : active.direction * -12,
                    }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <MeasuredContent token={active.kind} onHeight={setHeight}>
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
                    </MeasuredContent>
                  </m.div>
                </AnimatePresence>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </NavPreviewContext.Provider>
  )
}

const MeasuredContent = ({
  children,
  token,
  onHeight,
}: {
  children: ReactNode
  token: string
  onHeight: (height: number) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const tokenRef = useRef(token)
  tokenRef.current = token
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const report = () => {
      if (tokenRef.current !== token) return
      onHeight(element.offsetHeight)
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(element)
    return () => observer.disconnect()
  }, [onHeight, token])
  return <div ref={ref}>{children}</div>
}
