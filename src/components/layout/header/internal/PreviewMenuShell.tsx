'use client'

import {
  AnimatePresence,
  m,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react'
import Link from 'next/link'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { ArticleHoverHighlight } from '~/components/modules/post/PostItemHoverOverlay'
import { RootPortal } from '~/components/ui/portal'
import { microReboundPreset } from '~/constants/spring'
import { useResetHover } from '~/hooks/common/use-reset-hover'
import { clsxm } from '~/lib/helper'

import { useNavPreview } from './nav-preview-context'
import { formatCategoryPreviewDate } from './post-preview'
import { previewGridStyle } from './preview-layout'

const panelWidth = 720
export const previewRowCount = 5

export type PreviewSection = {
  id: string
  title: string
  href: string
  count?: number
}

export type PreviewEntry = {
  id: string
  title: string
  href: string
  created?: string
  meta?: string
}

export const PreviewMenuShell: Component<{
  label: string
  sections: PreviewSection[]
  activeId: string | null
  onActive: (id: string) => void
  sectionHeading: string
  recentHeading: string
  items: PreviewEntry[]
  status: 'loading' | 'ready' | 'empty' | 'error'
  emptyText: string
  emptySectionText?: string
  errorText: string
  footerHref: string
  footerLabel: string
  secondaryFooterHref?: string
  secondaryFooterLabel?: string
  totalText?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  embedded?: boolean
}> = memo(
  ({
    children,
    label,
    sections,
    activeId,
    onActive,
    sectionHeading,
    recentHeading,
    items,
    status,
    emptyText,
    emptySectionText = '暂时安静',
    errorText,
    footerHref,
    footerLabel,
    secondaryFooterHref,
    secondaryFooterLabel,
    totalText,
    open,
    onOpenChange,
    embedded = false,
  }) => {
    const triggerRef = useRef<HTMLDivElement>(null)
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [position, setPosition] = useState({
      top: 0,
      left: 0,
      width: panelWidth,
    })
    const resolvedActiveId = sections.some((section) => section.id === activeId)
      ? activeId
      : (sections[0]?.id ?? null)
    const cancelClose = useCallback(() => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
    }, [])
    const closeSoon = useCallback(() => {
      cancelClose()
      closeTimer.current = setTimeout(() => onOpenChange(false), 200)
    }, [cancelClose, onOpenChange])
    const updatePosition = useCallback(() => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(panelWidth, window.innerWidth - 24)
      const preferredLeft = rect.left + rect.width / 2 - width / 2
      setPosition({
        top: rect.bottom + 10,
        left: Math.max(
          12,
          Math.min(preferredLeft, window.innerWidth - width - 12),
        ),
        width,
      })
    }, [])
    const show = useCallback(() => {
      cancelClose()
      updatePosition()
      onOpenChange(true)
    }, [cancelClose, onOpenChange, updatePosition])

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

    const preview = useNavPreview()
    const close = () => {
      onOpenChange(false)
      if (embedded) preview?.close()
    }

    if (embedded) {
      return (
        <div role="menu" aria-label={label}>
          <EmbeddedBody
            sections={sections}
            resolvedActiveId={resolvedActiveId}
            onActive={onActive}
            sectionHeading={sectionHeading}
            recentHeading={recentHeading}
            items={items}
            status={status}
            emptyText={emptyText}
            emptySectionText={emptySectionText}
            errorText={errorText}
            footerHref={footerHref}
            footerLabel={footerLabel}
            secondaryFooterHref={secondaryFooterHref}
            secondaryFooterLabel={secondaryFooterLabel}
            totalText={totalText}
            onClose={close}
          />
        </div>
      )
    }

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
                aria-label={label}
                className="fixed z-[99] overflow-hidden rounded-xl border border-zinc-900/5 bg-white/95 shadow-lg shadow-zinc-800/10 backdrop-blur-md dark:border-zinc-100/10 dark:bg-neutral-900/95"
                style={{
                  top: position.top,
                  left: position.left,
                  width: position.width,
                }}
                initial={{ y: 10, opacity: 0, scale: 0.98 }}
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
                    close()
                    triggerRef.current?.querySelector('a')?.focus()
                  }
                  if (sections.length === 0) return
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
                    return
                  }
                  event.preventDefault()
                  const index = sections.findIndex(
                    (section) => section.id === resolvedActiveId,
                  )
                  const next =
                    event.key === 'ArrowDown'
                      ? sections[(index + 1) % sections.length]
                      : sections[
                          (index - 1 + sections.length) % sections.length
                        ]
                  if (next) onActive(next.id)
                }}
              >
                <EmbeddedBody
                  sections={sections}
                  resolvedActiveId={resolvedActiveId}
                  onActive={onActive}
                  sectionHeading={sectionHeading}
                  recentHeading={recentHeading}
                  items={items}
                  status={status}
                  emptyText={emptyText}
                  emptySectionText={emptySectionText}
                  errorText={errorText}
                  footerHref={footerHref}
                  footerLabel={footerLabel}
                  secondaryFooterHref={secondaryFooterHref}
                  secondaryFooterLabel={secondaryFooterLabel}
                  totalText={totalText}
                  onClose={close}
                />
              </m.div>
            )}
          </AnimatePresence>
        </RootPortal>
      </>
    )
  },
)
PreviewMenuShell.displayName = 'PreviewMenuShell'

export const PreviewRail = ({
  heading,
  sections,
  activeId,
  onActive,
  onNavigate,
  loading = false,
  emptyText,
}: {
  heading: string
  sections: PreviewSection[]
  activeId: string | null
  onActive: (id: string) => void
  onNavigate: () => void
  loading?: boolean
  emptyText?: string
}) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(120)
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, var(--spotlight-color) 0%, transparent 65%)`
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    mouseX.set(event.clientX - bounds.left)
    mouseY.set(event.clientY - bounds.top)
    radius.set(Math.hypot(bounds.width, bounds.height) / 2.5)
  }

  const railRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{
    top: number
    height: number
  } | null>(null)
  const measureIndicator = useCallback(() => {
    const rail = railRef.current
    const activeRow = rail?.querySelector<HTMLElement>(
      '[data-section-active="true"]',
    )
    if (!rail || !activeRow) {
      setIndicator(null)
      return
    }
    const railBox = rail.getBoundingClientRect()
    const rowBox = activeRow.getBoundingClientRect()
    const inset = 8
    setIndicator({
      top: rowBox.top - railBox.top + inset,
      height: Math.max(rowBox.height - inset * 2, 8),
    })
  }, [])
  useLayoutEffect(() => {
    measureIndicator()
  }, [activeId, sections, measureIndicator])

  return (
    <div
      ref={railRef}
      className="group relative border-b border-zinc-900/10 py-3 [--spotlight-color:oklch(var(--a)_/_0.12)] dark:border-zinc-100/10 sm:border-b-0"
      onMouseMove={handleMouseMove}
    >
      {/*
        The column rule is drawn as its own 1px element rather than a right
        border. The active marker below sits on the exact same right-0/w-px box,
        so the accent line always lands on the divider instead of next to it.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-zinc-900/10 dark:bg-zinc-100/10 sm:block"
      />
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
      <div className="relative">
        <div className="px-5 pb-2 pt-1 text-xs text-zinc-400">{heading}</div>
        <div
          className="max-h-[22rem] overflow-y-auto overflow-x-hidden"
          onScroll={measureIndicator}
        >
          {sections.length === 0 && loading ? (
            <SectionSkeleton />
          ) : sections.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-400">{emptyText}</p>
          ) : (
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <SectionRow
                    section={section}
                    active={section.id === activeId}
                    onActivate={() => onActive(section.id)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const SectionRow = ({
  section,
  active,
  onActivate,
  onNavigate,
}: {
  section: PreviewSection
  active: boolean
  onActivate: () => void
  onNavigate: () => void
}) => (
  <Link
    href={section.href}
    role="menuitem"
    data-section-active={active ? 'true' : undefined}
    className={clsxm(
      'group/section relative flex items-center justify-between gap-3 px-5 py-2 text-sm transition-colors',
      active
        ? 'text-accent'
        : 'text-zinc-800 hover:text-accent/80 dark:text-zinc-200',
    )}
    onMouseEnter={onActivate}
    onFocus={onActivate}
    onClick={onNavigate}
  >
    <span className="preview-section-title min-w-0 truncate">
      {section.title}
    </span>
    {typeof section.count === 'number' && (
      <span className="shrink-0 tabular-nums">{section.count}</span>
    )}
  </Link>
)

const SectionSkeleton = () => (
  <div className="space-y-3 px-5 py-2">
    {Array.from({ length: 4 }, (_, index) => (
      <div
        key={index}
        className="h-4 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-700/50"
      />
    ))}
  </div>
)

export const EntryList = ({
  items,
  listKey,
  status,
  emptyText,
  errorText,
  onNavigate,
}: {
  items: PreviewEntry[]
  listKey: string
  status: 'loading' | 'ready' | 'empty' | 'error'
  emptyText: string
  errorText: string
  onNavigate: () => void
}) => {
  const listRef = useRef<HTMLUListElement>(null)
  const [maxHeight, setMaxHeight] = useState<number>()
  const scrollable =
    status !== 'loading' && status !== 'error' && items.length > 0

  useLayoutEffect(() => {
    if (!scrollable || items.length <= previewRowCount) {
      setMaxHeight(undefined)
      return
    }
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const row = list.querySelectorAll(':scope > li')[previewRowCount - 1] as
        | HTMLElement
        | undefined
      const next = row ? row.offsetTop + row.offsetHeight : undefined
      setMaxHeight((current) => (current === next ? current : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const child of list.children) observer.observe(child)
    return () => observer.disconnect()
  }, [items, listKey, scrollable])

  if (status === 'loading') return <EntrySlots />
  if (status === 'error') {
    return <p className="px-5 py-6 text-sm text-zinc-400">{errorText}</p>
  }
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-zinc-400">{emptyText}</p>
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.ul
        layoutScroll
        ref={listRef}
        key={listKey}
        className="relative isolate overflow-y-auto overflow-x-hidden overscroll-y-contain"
        style={
          items.length > previewRowCount
            ? { maxHeight: maxHeight ?? '17.5rem' }
            : undefined
        }
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      >
        {items.map((item, index) => (
          <li key={item.id} className="relative">
            <EntryNode first={index === 0} last={index === items.length - 1} />
            <PreviewEntryLink
              item={item}
              listKey={listKey}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </m.ul>
    </AnimatePresence>
  )
}

const EntryNode = ({ first, last }: { first: boolean; last: boolean }) => (
  <>
    {!(first && last) && (
      <span
        aria-hidden
        className={clsxm(
          'pointer-events-none absolute left-[1.15rem] z-10 w-0.5 -translate-x-1/2 bg-accent',
          first ? 'bottom-0 top-1/2' : last ? 'top-0 bottom-1/2' : 'inset-y-0',
        )}
      />
    )}
    <span
      aria-hidden
      className="pointer-events-none absolute left-[1.15rem] top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
    />
  </>
)

const highlightTransition = {
  layout: { type: 'spring' as const, stiffness: 680, damping: 32, mass: 0.35 },
  opacity: { duration: 0.12 },
  scale: { type: 'spring' as const, stiffness: 680, damping: 32, mass: 0.35 },
}

const PreviewEntryLink = ({
  item,
  listKey,
  onNavigate,
}: {
  item: PreviewEntry
  listKey: string
  onNavigate: () => void
}) => {
  const [hover, setHover] = useState(false)
  useResetHover(setHover)
  return (
    <div className="relative min-w-0">
      <ArticleHoverHighlight
        layoutId={`preview-entry-hover-${listKey}`}
        active={hover}
        transition={highlightTransition}
        className="inset-y-1.5 left-7 right-3 z-0 rounded-xl"
      />
      <Link
        href={item.href}
        role="menuitem"
        title={item.title}
        className="relative z-10 flex min-w-0 items-center gap-3 py-2 pl-8 pr-4 text-sm leading-5 text-zinc-700 dark:text-zinc-200"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={onNavigate}
      >
        {item.created && (
          <span className="w-12 shrink-0 text-center text-xs tabular-nums text-zinc-400">
            {formatCategoryPreviewDate(item.created)}
          </span>
        )}
        <span className="min-w-0 flex-1 whitespace-normal break-words">
          {item.title}
        </span>
        {item.meta && (
          <span className="shrink-0 self-center text-xs tracking-wide text-zinc-400">
            {item.meta}
          </span>
        )}
      </Link>
    </div>
  )
}
const EntrySlots = () => (
  <div className="px-5 py-2">
    {Array.from({ length: previewRowCount }, (_, index) => (
      <div key={index} className="flex h-9 items-center gap-3">
        <span className="h-2.5 w-12 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-700/50" />
        <span className="h-2.5 flex-1 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-700/50" />
      </div>
    ))}
  </div>
)

const EmbeddedBody = ({
  sections,
  resolvedActiveId,
  onActive,
  sectionHeading,
  recentHeading,
  items,
  status,
  emptyText,
  emptySectionText,
  errorText,
  footerHref,
  footerLabel,
  secondaryFooterHref,
  secondaryFooterLabel,
  totalText,
  onClose,
}: {
  sections: PreviewSection[]
  resolvedActiveId: string | null
  onActive: (id: string) => void
  sectionHeading: string
  recentHeading: string
  items: PreviewEntry[]
  status: 'loading' | 'ready' | 'empty' | 'error'
  emptyText: string
  emptySectionText: string
  errorText: string
  footerHref: string
  footerLabel: string
  secondaryFooterHref?: string
  secondaryFooterLabel?: string
  totalText?: string
  onClose: () => void
}) => (
  <>
    <div className="grid w-max" style={previewGridStyle}>
      <PreviewRail
        heading={sectionHeading}
        sections={sections}
        activeId={resolvedActiveId}
        onActive={onActive}
        onNavigate={onClose}
        loading={status === 'loading'}
        emptyText={emptySectionText}
      />
      <div className="min-w-0 py-3">
        <div className="px-5 pb-2 pt-1 text-xs text-zinc-400">
          {recentHeading}
        </div>
        <EntryList
          items={items}
          listKey={resolvedActiveId || recentHeading}
          status={status}
          emptyText={emptyText}
          errorText={errorText}
          onNavigate={onClose}
        />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-zinc-900/10 px-5 py-3.5 text-sm dark:border-zinc-100/10">
      <Link
        href={footerHref}
        className="text-zinc-700 transition-colors hover:text-accent dark:text-zinc-200"
        onClick={onClose}
      >
        {footerLabel}
        <span aria-hidden="true"> →</span>
      </Link>
      {secondaryFooterHref && secondaryFooterLabel ? (
        <Link
          href={secondaryFooterHref}
          className="text-zinc-400 transition-colors hover:text-accent"
          onClick={onClose}
        >
          {secondaryFooterLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      ) : (
        <span className="tabular-nums text-zinc-400">{totalText}</span>
      )}
    </div>
  </>
)
