'use client'

import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { RootPortal } from '~/components/ui/portal'
import { microReboundPreset } from '~/constants/spring'
import { clsxm } from '~/lib/helper'

import { useNavPreview } from './nav-preview-context'
import { formatCategoryPreviewDate } from './post-preview'

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
                  if (!sections.length) return
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
    className={clsxm(
      'relative flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors',
      active
        ? 'bg-accent/5 text-zinc-900 dark:text-zinc-50'
        : 'text-zinc-500 hover:bg-accent/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
    )}
    onMouseEnter={onActivate}
    onFocus={onActivate}
    onClick={onNavigate}
  >
    {active && (
      <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-accent" />
    )}
    <span className="min-w-0 truncate">{section.title}</span>
    {typeof section.count === 'number' && (
      <span className="shrink-0 tabular-nums text-accent/80">
        {section.count}
      </span>
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
  if (status === 'loading') return <EntrySlots />
  if (status === 'error') {
    return <p className="px-5 py-6 text-sm text-zinc-400">{errorText}</p>
  }
  const rows = Array.from(
    { length: previewRowCount },
    (_, index) => items[index] ?? null,
  )
  if (rows.every((row) => !row)) {
    return <p className="px-5 py-6 text-sm text-zinc-400">{emptyText}</p>
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.ul
        key={listKey}
        className="max-h-[22rem] overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      >
        {rows.map((item, index) =>
          item ? (
            <li key={item.id}>
              <Link
                href={item.href}
                role="menuitem"
                title={item.title}
                className="flex min-w-0 items-baseline gap-3 px-5 py-2 text-sm leading-5 text-zinc-700 transition-colors hover:bg-accent/5 hover:text-accent dark:text-zinc-200"
                onClick={onNavigate}
              >
                {item.created && (
                  <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-400">
                    {formatCategoryPreviewDate(item.created)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.meta && (
                  <span className="shrink-0 text-xs tracking-wide text-zinc-400">
                    {item.meta}
                  </span>
                )}
              </Link>
            </li>
          ) : (
            <li key={`${listKey}-empty-${index}`} aria-hidden className="h-9" />
          ),
        )}
      </m.ul>
    </AnimatePresence>
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
    <div className="grid grid-cols-1 sm:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="border-b border-zinc-900/10 py-3 dark:border-zinc-100/10 sm:border-b-0 sm:border-r">
        <div className="px-5 pb-2 pt-1 text-xs text-zinc-400">
          {sectionHeading}
        </div>
        <div className="max-h-[22rem] overflow-y-auto">
          {sections.length === 0 && status === 'loading' ? (
            <SectionSkeleton />
          ) : sections.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-400">
              {emptySectionText}
            </p>
          ) : (
            sections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                active={section.id === resolvedActiveId}
                onActivate={() => onActive(section.id)}
                onNavigate={onClose}
              />
            ))
          )}
        </div>
      </div>
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
