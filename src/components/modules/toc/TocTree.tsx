'use client'

import clsx from 'clsx'
import { atom, useAtom } from 'jotai'
import { m } from 'motion/react'
import type { FC } from 'react'
import * as React from 'react'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import { Divider } from '~/components/ui/divider'
import { RightToLeftTransitionView } from '~/components/ui/transition'
import { useStateToRef } from '~/hooks/common/use-state-ref'
import { useMaskScrollArea } from '~/hooks/shared/use-mask-scrollarea'
import { clsxm } from '~/lib/helper'
import { springScrollToElement } from '~/lib/scroller'

import type { TocSharedProps } from './TocAside'
import type { ITocItem } from './TocItem'
import { TocItem } from './TocItem'

const tocActiveIdAtom = atom<string | null>(null)

function useActiveId(
  $headings: HTMLHeadingElement[],
  navigationLockRef: React.RefObject<string | null>,
  getCurrentHeadingId: () => string | null,
) {
  const [activeId, setActiveId] = useAtom(tocActiveIdAtom)
  useEffect(() => {
    const observer = new IntersectionObserver(
      () => {
        if (navigationLockRef.current) return
        // A heading merely entering the viewport isn't the current section.
        setActiveId(getCurrentHeadingId())
      },
      { rootMargin: `-100px 0px -100px 0px` },
    )
    $headings.forEach(($heading) => {
      observer.observe($heading)
    })
    return () => {
      observer.disconnect()
    }
  }, [$headings, getCurrentHeadingId, navigationLockRef, setActiveId])

  return [activeId, setActiveId] as const
}

export const TocTree: Component<
  {
    $headings: HTMLHeadingElement[]
    containerRef?: React.MutableRefObject<HTMLUListElement | null>
    /**
     * 下次循环中跳转，在 Modal 中很管用
     */
    scrollInNextTick?: boolean

    onItemClick?: (item: ITocItem) => void
  } & TocSharedProps
> = ({
  $headings,
  containerRef,
  className,
  accessory,
  scrollInNextTick,
  onItemClick,
}) => {
  const navigationLockRef = useRef<string | null>(null)
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interruptFrameRef = useRef<number | null>(null)
  const getCurrentHeadingId = useCallback(() => {
    // The current section is the last heading that has reached the sticky header.
    let current = $headings[0]
    for (const heading of $headings) {
      if (!heading.isConnected) continue
      if (heading.getBoundingClientRect().top > 120) break
      current = heading
    }
    return current?.id ?? null
  }, [$headings])
  const [activeId, setActiveId] = useActiveId(
    $headings,
    navigationLockRef,
    getCurrentHeadingId,
  )

  useEffect(() => {
    const unlock = () => {
      if (!navigationLockRef.current) return
      navigationLockRef.current = null
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
      if (interruptFrameRef.current !== null)
        cancelAnimationFrame(interruptFrameRef.current)
      // Read after the browser applies the user's wheel/touch/keyboard movement.
      interruptFrameRef.current = requestAnimationFrame(() => {
        interruptFrameRef.current = null
        if (navigationLockRef.current) return
        setActiveId(getCurrentHeadingId())
      })
    }
    const unlockOnKey = (event: KeyboardEvent) => {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'PageUp',
          'PageDown',
          'Home',
          'End',
          ' ',
        ].includes(event.key)
      )
        unlock()
    }
    window.addEventListener('wheel', unlock, { passive: true })
    window.addEventListener('touchmove', unlock, { passive: true })
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlockOnKey)
    return () => {
      window.removeEventListener('wheel', unlock)
      window.removeEventListener('touchmove', unlock)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlockOnKey)
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current)
      if (interruptFrameRef.current !== null)
        cancelAnimationFrame(interruptFrameRef.current)
      navigationLockRef.current = null
    }
  }, [getCurrentHeadingId, setActiveId])

  const toc: ITocItem[] = useMemo(() => {
    return Array.from($headings).map((el, idx) => {
      const depth = +el.tagName.slice(1)
      const elClone = el.cloneNode(true) as HTMLElement
      elClone.querySelectorAll('del, .katex-container').forEach((del) => {
        del.remove()
      })

      const title = elClone.textContent || ''

      const index = idx

      return {
        depth,
        index: Number.isNaN(index) ? -1 : index,
        title,
        anchorId: el.id,
        $heading: el,
      }
    })
  }, [$headings])

  const rootDepth = useMemo(
    () =>
      toc?.length
        ? (toc.reduce(
            (d: number, cur) => Math.min(d, cur.depth),
            toc[0]?.depth || 0,
          ) as any as number)
        : 0,
    [toc],
  )

  const tocRef = useStateToRef(toc)
  const handleScrollTo = useCallback(
    (i: number, $el: HTMLElement | null, anchorId: string) => {
      onItemClick?.(tocRef.current[i])

      if ($el) {
        if (interruptFrameRef.current !== null)
          cancelAnimationFrame(interruptFrameRef.current)
        interruptFrameRef.current = null
        navigationLockRef.current = anchorId
        setActiveId(anchorId)
        if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current)
        lockTimeoutRef.current = setTimeout(() => {
          if (navigationLockRef.current === anchorId) {
            navigationLockRef.current = null
            setActiveId(getCurrentHeadingId())
          }
          lockTimeoutRef.current = null
        }, 5000)

        const handle = () => {
          springScrollToElement($el, -100, { followLayout: true })
        }
        if (scrollInNextTick) {
          requestAnimationFrame(() => {
            handle()
          })
        } else handle()
      }
    },
    [getCurrentHeadingId, onItemClick, scrollInNextTick, setActiveId, tocRef],
  )
  const accessoryElement = useMemo(() => {
    if (!accessory) return null
    return React.isValidElement(accessory)
      ? accessory
      : React.createElement(accessory as FC)
  }, [accessory])

  const [scrollContainerRef, scrollClassname] =
    useMaskScrollArea<HTMLUListElement>()

  return (
    <ul
      className={clsxm('scrollbar-none flex grow flex-col px-2', className)}
      ref={containerRef}
    >
      <ul
        className={clsx('scrollbar-none overflow-auto', scrollClassname)}
        ref={scrollContainerRef}
      >
        {toc?.map((heading) => (
          <MemoedItem
            heading={heading}
            isActive={heading.anchorId === activeId}
            key={`${heading.title}-${heading.index}`}
            rootDepth={rootDepth}
            onClick={handleScrollTo}
          />
        ))}
      </ul>
      {accessoryElement && (
        <li className="shrink-0">
          {toc.length > 0 && <Divider />}
          {accessoryElement}
        </li>
      )}
    </ul>
  )
}
const MemoedItem = memo<{
  isActive: boolean
  heading: ITocItem
  rootDepth: number
  onClick?: (i: number, $el: HTMLElement | null, anchorId: string) => void
}>((props) => {
  const {
    heading,
    isActive,
    onClick,
    rootDepth,
    // containerRef
  } = props

  const itemRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive) return

    const $item = itemRef.current
    if (!$item) return
    const $container = $item.parentElement
    if (!$container) return

    // 把当前 active Item 滚动到容器的中间
    const containerHeight = $container.clientHeight
    const itemHeight = $item.clientHeight
    const itemTop =
      $item.getBoundingClientRect().top -
      $container.getBoundingClientRect().top +
      $container.scrollTop
    const itemBottom = itemTop + itemHeight
    if (
      itemTop < $container.scrollTop ||
      itemBottom > $container.scrollTop + containerHeight
    ) {
      $container.scrollTop = itemTop - (containerHeight - itemHeight) / 2
    }
  }, [isActive])

  return (
    <RightToLeftTransitionView
      timeout={
        useRef({
          exit: 50,
          enter: 50 * heading.index,
        }).current
      }
      key={heading.title}
      as="li"
      className="relative leading-none"
      ref={itemRef}
    >
      {isActive && (
        <m.span
          layoutId="active-toc-item"
          layout
          transition={{
            layout: {
              type: 'tween',
              duration: 0.22,
              ease: 'easeOut',
            },
          }}
          className="absolute inset-y-[3px] left-0 w-[2px] rounded-sm bg-accent"
        />
      )}
      <TocItem
        heading={heading}
        onClick={onClick}
        active={isActive}
        key={heading.title}
        rootDepth={rootDepth}
      />
    </RightToLeftTransitionView>
  )
})
MemoedItem.displayName = 'MemoedItem'
