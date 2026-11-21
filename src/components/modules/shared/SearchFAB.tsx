'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { KeyboardEventHandler } from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { currentIsMobile, useIsLogged, useIsMobile } from '~/atoms/hooks'
import {
  searchKeywordAtom,
  searchPanelOpenAtom,
  searchPanelTransitioningAtom,
  searchPanelTriggerAtom,
} from '~/atoms/search-panel'
import { EmptyIcon } from '~/components/icons/empty'
import type { SearchListType } from '~/components/modules/shared/search-results'
import {
  mapAlgoliaPayload,
  mapDatabaseSearch,
} from '~/components/modules/shared/search-results'
import { MotionButtonBase } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'
import { RootPortal } from '~/components/ui/portal'
import { PresentSheet } from '~/components/ui/sheet'
import { useSheetEntrance } from '~/components/ui/sheet/use-sheet-entrance'
import useDebounceValue from '~/hooks/common/use-debounce-value'
import { getToken } from '~/lib/cookie'
import { noopArr } from '~/lib/noop'
import { loadPublishedPostIds } from '~/lib/public-posts'
import { publicContentQueryOptions } from '~/lib/publication'
import { publicApiClient as apiClient } from '~/lib/request'
import { jotaiStore } from '~/lib/store'

import {
  listContainerClassName,
  listLinkClassName,
  listScrollClassName,
} from './list-highlight-layout'
import { ListHighlightRow } from './ListHighlightRow'
import {
  getSearchPanelBounds,
  getSearchTriggerBounds,
} from './search-transition'

let algoliaSearchEnabled: boolean | null = null
const isComposingAtom = atom(false)

const isVisibleTrigger = (
  element: HTMLButtonElement,
  includeOpacity = true,
) => {
  if (!element.isConnected || element.getBoundingClientRect().width === 0)
    return false
  let parent: HTMLElement | null = element
  while (parent) {
    const style = getComputedStyle(parent)
    if (
      style.visibility === 'hidden' ||
      (style.opacity === '0' && (includeOpacity || parent !== element))
    )
      return false
    parent = parent.parentElement
  }
  return true
}

const openSearchPanel = (trigger?: HTMLButtonElement) => {
  if (jotaiStore.get(searchPanelOpenAtom)) return
  const visibleTrigger =
    trigger ??
    [
      ...document.querySelectorAll<HTMLButtonElement>('[data-search-trigger]'),
    ].find((element) => isVisibleTrigger(element)) ??
    null
  jotaiStore.set(searchPanelTriggerAtom, visibleTrigger)
  jotaiStore.set(searchPanelTransitioningAtom, !currentIsMobile())
  jotaiStore.set(searchPanelOpenAtom, true)
}

export const HeaderSearchButton = ({
  mobile = false,
}: {
  mobile?: boolean
}) => {
  const panelOpen = useAtomValue(searchPanelOpenAtom)
  const transitioning = useAtomValue(searchPanelTransitioningAtom)
  const isMobile = useIsMobile()
  const button = (
    <m.button
      type="button"
      data-search-trigger
      aria-label="搜索文稿和手记"
      aria-haspopup="dialog"
      aria-expanded={panelOpen}
      aria-controls={panelOpen ? 'site-search-panel' : undefined}
      tabIndex={!mobile && transitioning ? -1 : 0}
      className={clsx(
        'pointer-events-auto relative flex shrink-0 items-center justify-center rounded-full',
        'text-zinc-800 ring-1 ring-zinc-900/5 dark:text-zinc-200',
        'transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        mobile
          ? 'size-[44px] touch-manipulation bg-base-100 px-3 text-[16px] dark:ring-white/10 dark:hover:ring-white/20'
          : 'size-10 bg-gradient-to-b from-zinc-50/70 to-white/90 shadow-lg shadow-zinc-800/5 backdrop-blur-md dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10 dark:hover:text-accent',
      )}
      initial={false}
      animate={{ opacity: !mobile && transitioning ? 0 : 1 }}
      transition={{ duration: 0 }}
      onClick={(event) => openSearchPanel(event.currentTarget)}
    >
      <i
        className={clsx('i-mingcute-search-line', !mobile && 'size-[18px]')}
        aria-hidden="true"
      />
    </m.button>
  )
  if (!mobile || !isMobile) return button
  return (
    <PresentSheet
      touchFriendly
      triggerAsChild
      title="搜索"
      open={panelOpen}
      onOpenChange={(open) => jotaiStore.set(searchPanelOpenAtom, open)}
      content={<SearchPanelImpl mobile />}
    >
      {button}
    </PresentSheet>
  )
}

const measureSearchPanel = () =>
  getSearchPanelBounds(
    window.innerWidth,
    window.innerHeight,
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  )

export const SearchPanelWithHotKey = () => {
  const pathname = usePathname()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const onPostsPage =
        pathname === '/posts' || pathname.startsWith('/posts/')
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        if (!onPostsPage) return
        e.preventDefault()
        openSearchPanel()
      }

      if (
        e.key === 'Escape' &&
        jotaiStore.get(searchPanelOpenAtom) &&
        !jotaiStore.get(isComposingAtom)
      ) {
        e.preventDefault()
        jotaiStore.set(searchPanelOpenAtom, false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [pathname])
  useEffect(() => {
    jotaiStore.set(searchPanelOpenAtom, false)
  }, [pathname])
  return <SearchPanel />
}

const SearchPanel = () => {
  const panelOpen = useAtomValue(searchPanelOpenAtom)
  const isMobile = useIsMobile()
  useEffect(() => {
    if (isMobile && !panelOpen) {
      jotaiStore.set(searchPanelTransitioningAtom, false)
      jotaiStore.set(searchPanelTriggerAtom, null)
      jotaiStore.set(isComposingAtom, false)
    }
  }, [isMobile, panelOpen])

  if (isMobile) return null

  return (
    <RootPortal>
      <AnimatePresence
        onExitComplete={() => {
          if (jotaiStore.get(searchPanelOpenAtom)) return
          const trigger = jotaiStore.get(searchPanelTriggerAtom)
          jotaiStore.set(searchPanelTransitioningAtom, false)
          if (trigger && isVisibleTrigger(trigger, false))
            trigger.focus({ preventScroll: true })
          jotaiStore.set(searchPanelTriggerAtom, null)
          jotaiStore.set(isComposingAtom, false)
        }}
      >
        {panelOpen && (
          <m.div
            key="search-backdrop"
            className="fixed inset-0 z-20 bg-zinc-950/20 backdrop-blur-[2px] dark:bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            onClick={() => {
              jotaiStore.set(searchPanelOpenAtom, false)
            }}
          />
        )}
        {panelOpen && <SearchPanelImpl key="search-panel" />}
      </AnimatePresence>
    </RootPortal>
  )
}

const currentSelectAtom = atom(0)

const SearchPanelImpl = ({ mobile = false }: { mobile?: boolean }) => {
  const [keyword, setKeyword] = useAtom(searchKeywordAtom)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const trigger = useAtomValue(searchPanelTriggerAtom)
  const reducedMotion = useReducedMotion()
  const inputEntrance = useSheetEntrance()
  const emptyEntrance = useSheetEntrance(1)
  const [bounds, setBounds] = useState(measureSearchPanel)
  const [origin] = useState(() =>
    trigger
      ? getSearchTriggerBounds(trigger.getBoundingClientRect())
      : {
          ...bounds,
          x: bounds.x + bounds.width / 2 - 20,
          y: bounds.y + bounds.height / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
        },
  )
  const [originIconSize] = useState(
    () => trigger?.querySelector('i')?.getBoundingClientRect().width || 18,
  )
  const iconOrigin = {
    x: (origin.width - originIconSize) / 2,
    y: (origin.height - originIconSize) / 2,
    width: originIconSize,
    height: originIconSize,
  }
  const iconTarget = {
    x: bounds.borderRadius * 1.25,
    y: mobile ? 19 : (bounds.borderRadius * 3.5 - 18) / 2,
    width: 18,
    height: 18,
  }
  const setCurrentSelect = useSetAtom(currentSelectAtom)
  const debouncedKeyword = useDebounceValue(keyword, 360)
  const returnTrigger =
    trigger && isVisibleTrigger(trigger, false)
      ? trigger
      : [
          ...document.querySelectorAll<HTMLButtonElement>(
            '[data-search-trigger]',
          ),
        ].find((element) => isVisibleTrigger(element, false))

  useEffect(() => {
    if (mobile) inputRef.current?.focus({ preventScroll: true })
    else panelRef.current?.focus({ preventScroll: true })
    const onResize = () => setBounds(measureSearchPanel())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mobile])

  useEffect(() => {
    setCurrentSelect(0)
  }, [debouncedKeyword, setCurrentSelect])

  const {
    data: _data,
    isLoading,
    isFetching,
  } = useQuery({
    ...publicContentQueryOptions,
    queryKey: ['search', debouncedKeyword],
    enabled: debouncedKeyword.trim().length > 0,
    queryFn: async ({ queryKey }) => {
      const term = String(queryKey[1] ?? '').trim()
      if (!term) return []
      const publishedIds = await loadPublishedPostIds()
      const visible = (rows: SearchListType[]) =>
        rows.filter(
          (row) =>
            !row.id.startsWith('post-') || publishedIds.has(row.id.slice(5)),
        )

      if (algoliaSearchEnabled !== false) {
        try {
          const algolia = await apiClient.search.searchByAlgolia(term)
          const mapped = mapAlgoliaPayload(algolia)
          if (mapped) {
            algoliaSearchEnabled = true
            return visible(mapped)
          }
        } catch {
          // This deployment does not expose Algolia search.
        }
        algoliaSearchEnabled = false
      }

      const [posts, notes] = await Promise.all([
        apiClient.search.search('post', term).catch(() => null),
        apiClient.search.search('note', term).catch(() => null),
      ])
      return visible(mapDatabaseSearch(posts, notes))
    },
  })
  const data = _data || noopArr
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (
        e.key === 'Escape' &&
        !e.nativeEvent.isComposing &&
        !jotaiStore.get(isComposingAtom)
      ) {
        e.preventDefault()
        jotaiStore.set(searchPanelOpenAtom, false)
        return
      }
      if (e.key === 'Tab') {
        if (mobile) return
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'input, button, a[href], [tabindex="0"]',
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable.item(focusable.length - 1)
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panelRef.current)
        ) {
          e.preventDefault()
          last.focus()
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === panelRef.current)
        ) {
          e.preventDefault()
          first.focus()
        }
        return
      }
      if (!listRef.current) {
        return
      }
      const $ = listRef.current
      const currentSelect = jotaiStore.get(currentSelectAtom)

      switch (e.key) {
        case 'Enter': {
          $.children.item(currentSelect)?.querySelector('a')?.click()

          break
        }
        case 'ArrowDown': {
          setCurrentSelect((currentSelect) => {
            const index = currentSelect + 1
            return data.length > 0 ? index % data.length : 0
          })

          break
        }
        case 'ArrowUp': {
          setCurrentSelect((currentSelect) => {
            const index = currentSelect - 1
            return data.length > 0 ? (index + data.length) % data.length : 0
          })

          break
        }
      }

      $.children.item(currentSelect)?.scrollIntoView({
        behavior: 'smooth',
      })
    },
    [data.length, mobile, setCurrentSelect],
  )

  const isLogged = useIsLogged()

  return (
    <m.div
      id="site-search-panel"
      ref={panelRef}
      className={clsx(
        'overflow-hidden outline-none',
        mobile
          ? 'relative flex min-h-0 flex-1 flex-col'
          : 'fixed left-0 top-0 z-20 rounded-2xl bg-gradient-to-b from-zinc-50/90 to-white/95 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/90 dark:to-zinc-800/95 dark:shadow-zinc-950/30 dark:ring-zinc-100/10',
      )}
      style={mobile ? { width: '100%', height: '100%' } : undefined}
      onKeyDown={handleKeyDown}
      role={mobile ? undefined : 'dialog'}
      aria-modal={mobile ? undefined : true}
      aria-label={mobile ? undefined : '搜索文稿和手记'}
      tabIndex={-1}
      initial={
        mobile
          ? false
          : reducedMotion
            ? { ...bounds, opacity: 0 }
            : { ...origin }
      }
      animate={mobile ? { opacity: 1 } : { ...bounds, opacity: 1 }}
      exit={
        mobile
          ? undefined
          : reducedMotion
            ? { opacity: 0 }
            : {
                ...(returnTrigger
                  ? getSearchTriggerBounds(
                      returnTrigger.getBoundingClientRect(),
                    )
                  : origin),
                transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
              }
      }
      transition={{
        duration: reducedMotion ? 0.12 : 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => {
        if (
          jotaiStore.get(searchPanelOpenAtom) &&
          document.activeElement === panelRef.current
        ) {
          inputRef.current?.focus({ preventScroll: true })
        }
      }}
    >
      {!mobile && (
        <m.i
          data-search-morph-icon
          aria-hidden="true"
          className="i-mingcute-search-line pointer-events-none absolute left-0 top-0 z-10 text-zinc-800 dark:text-zinc-200"
          initial={mobile ? false : reducedMotion ? iconTarget : iconOrigin}
          animate={iconTarget}
          exit={
            mobile
              ? undefined
              : reducedMotion
                ? { opacity: 0 }
                : {
                    ...iconOrigin,
                    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                  }
          }
          transition={{
            duration: reducedMotion ? 0.12 : 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      )}
      <m.div
        className="flex flex-col"
        style={
          mobile
            ? { width: '100%', height: '100%' }
            : { width: bounds.width, height: bounds.height }
        }
        initial={mobile ? false : { opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            delay: mobile || reducedMotion ? 0 : 0.16,
            duration: 0.2,
          },
        }}
        exit={
          mobile ? undefined : { opacity: 0, transition: { duration: 0.1 } }
        }
      >
        <m.div
          {...inputEntrance}
          className="relative flex min-h-[56px] shrink-0 items-center border-b border-zinc-900/10 dark:border-zinc-100/10 lg:min-h-0"
        >
          {mobile && (
            <i
              aria-hidden="true"
              className="i-mingcute-search-line pointer-events-none absolute left-4 size-[18px] text-zinc-500"
            />
          )}
          <input
            ref={inputRef}
            aria-label="搜索关键词"
            className="min-w-0 flex-1 bg-transparent py-4 pl-12 pr-5 text-[16px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100 lg:text-base"
            placeholder="搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onCompositionStart={() => {
              jotaiStore.set(isComposingAtom, true)
            }}
            onCompositionEnd={() => {
              jotaiStore.set(isComposingAtom, false)
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'Enter'
              ) {
                e.preventDefault()
              }
            }}
          />
          <button
            type="button"
            aria-label={mobile ? '清空搜索' : '关闭搜索'}
            disabled={mobile && keyword.length === 0}
            className="mr-1 flex size-[44px] shrink-0 touch-manipulation items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900/5 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-zinc-900/10 disabled:pointer-events-none disabled:opacity-0 dark:hover:bg-white/5 dark:hover:text-zinc-100 lg:mr-3 lg:size-8"
            onClick={() =>
              mobile
                ? setKeyword('')
                : jotaiStore.set(searchPanelOpenAtom, false)
            }
          >
            <i className="i-mingcute-close-line" aria-hidden="true" />
          </button>
        </m.div>
        <m.div
          layoutScroll
          className={listScrollClassName}
          style={data.length === 0 ? { scrollbarGutter: 'auto' } : undefined}
        >
          <ul
            className={clsx(
              listContainerClassName,
              data.length === 0 && 'h-full',
            )}
            ref={listRef}
          >
            {data.length === 0 && !isLoading ? (
              <m.div
                {...emptyEntrance}
                className="flex h-full items-center justify-center"
              >
                <div className="flex flex-col items-center space-y-2">
                  {!keyword ? (
                    <i className="i-mingcute-search-line text-3xl text-zinc-300 dark:text-zinc-600" />
                  ) : (
                    <EmptyIcon />
                  )}

                  {!data && isLoading && isFetching && (
                    <div className="loading-dots text-[30px]" />
                  )}
                  <span className="text-sm text-zinc-400">
                    {keyword ? '没有找到相关内容' : '搜索文稿和手记'}
                  </span>
                </div>
              </m.div>
            ) : (
              data.map((item, index) => {
                return <SearchItem key={item.id} {...item} index={index} />
              })
            )}

            {data.length === 0 && isLoading && (
              <m.div {...emptyEntrance} className="center flex h-full grow">
                <div className="loading loading-spinner" />
              </m.div>
            )}
          </ul>
        </m.div>

        {isLogged && (
          <div className="flex shrink-0 items-center px-4 py-2">
            <MotionButtonBase
              onClick={() => {
                window.open(
                  `${apiClient.search.proxy('algolia')('import-json').toString(true)}?token=${getToken()}`,
                )
              }}
            >
              <FloatPopover
                mobileAsSheet
                type="tooltip"
                triggerElement={<i className="i-mingcute-download-2-line" />}
              >
                下载搜索索引文件以便导入 algolia 搜索
              </FloatPopover>
            </MotionButtonBase>
          </div>
        )}
      </m.div>
    </m.div>
  )
}

const SearchItem = memo(function Item({
  index,
  ...item
}: {
  index: number
} & SearchListType) {
  const selectIndex = useAtomValue(currentSelectAtom)
  const isSelect = selectIndex === index
  return (
    <ListHighlightRow
      active={isSelect}
      index={index}
      layoutId="search-result-highlight"
      onSelect={() => jotaiStore.set(currentSelectAtom, index)}
    >
      <Link
        href={item.url}
        onClick={() => jotaiStore.set(searchPanelOpenAtom, false)}
        className={clsx(
          listLinkClassName,
          'z-10 flex-col items-start justify-center gap-1 text-[16px] text-zinc-800 active:bg-zinc-900/5 dark:text-zinc-100 dark:active:bg-white/5 lg:flex-row lg:items-center lg:justify-between lg:text-sm',
        )}
      >
        <span className="line-clamp-2 min-w-0 break-words leading-relaxed lg:block lg:flex-1 lg:shrink-0 lg:truncate">
          {item.title}
        </span>
        <span className="block min-w-0 shrink-0 grow-0 text-[12px] text-zinc-400 lg:text-xs">
          {item.subtitle}
        </span>
      </Link>
    </ListHighlightRow>
  )
})
