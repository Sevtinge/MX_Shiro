'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { KeyboardEventHandler } from 'react'
import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useIsLogged } from '~/atoms/hooks'
import { searchPanelOpenAtom } from '~/atoms/search-panel'
import { EmptyIcon } from '~/components/icons/empty'
import { ArticleHoverHighlight } from '~/components/modules/post/PostItemHoverOverlay'
import type { SearchListType } from '~/components/modules/shared/search-results'
import {
  mapAlgoliaPayload,
  mapDatabaseSearch,
} from '~/components/modules/shared/search-results'
import { MotionButtonBase } from '~/components/ui/button'
import { FABPortable } from '~/components/ui/fab'
import { FloatPopover } from '~/components/ui/float-popover'
import { modalMontionConfig } from '~/components/ui/modal/stacked/constants'
import useDebounceValue from '~/hooks/common/use-debounce-value'
import { useIsClient } from '~/hooks/common/use-is-client'
import { getToken } from '~/lib/cookie'
import { noopArr } from '~/lib/noop'
import { apiClient } from '~/lib/request'
import { jotaiStore } from '~/lib/store'

let algoliaSearchEnabled: boolean | null = null
const isComposingAtom = atom(false)
export const SearchFAB = () => {
  const isClient = useIsClient()
  if (!isClient) return null
  return (
    <>
      <FABPortable
        onClick={() => {
          jotaiStore.set(searchPanelOpenAtom, true)
        }}
      >
        <i className="i-mingcute-search-line" />
      </FABPortable>
    </>
  )
}

export const SearchPanelWithHotKey = () => {
  const pathname = usePathname()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const onPostsPage =
        pathname === '/posts' || pathname.startsWith('/posts/')
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        if (!onPostsPage) return
        e.preventDefault()
        jotaiStore.set(searchPanelOpenAtom, true)
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
  return <SearchPanel />
}

const SearchPanel = () => {
  const panelOpen = useAtomValue(searchPanelOpenAtom)

  return (
    <AnimatePresence>
      {panelOpen && (
        <m.div
          key="search-backdrop"
          className="fixed inset-0 z-20 bg-zinc-950/20 backdrop-blur-[2px] dark:bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            jotaiStore.set(searchPanelOpenAtom, false)
          }}
        />
      )}
      {panelOpen && <SearchPanelImpl key="search-panel" />}
    </AnimatePresence>
  )
}

const currentSelectAtom = atom(0)

const SearchPanelImpl = () => {
  const [keyword, setKeyword] = useState('')
  const listRef = useRef<HTMLUListElement>(null)
  const setCurrentSelect = useSetAtom(currentSelectAtom)
  const debouncedKeyword = useDebounceValue(keyword, 360)

  useEffect(() => {
    setCurrentSelect(0)
  }, [debouncedKeyword, setCurrentSelect])

  const {
    data: _data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['search', debouncedKeyword],
    enabled: debouncedKeyword.trim().length > 0,
    queryFn: async ({ queryKey }) => {
      const term = String(queryKey[1] ?? '').trim()
      if (!term) return []

      if (algoliaSearchEnabled !== false) {
        try {
          const algolia = await apiClient.search.searchByAlgolia(term)
          const mapped = mapAlgoliaPayload(algolia)
          if (mapped) {
            algoliaSearchEnabled = true
            return mapped
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
      return mapDatabaseSearch(posts, notes)
    },
  })
  const data = _data || noopArr
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
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
            return index ? index % data.length : 0
          })

          break
        }
        case 'ArrowUp': {
          setCurrentSelect((currentSelect) => {
            const index = currentSelect - 1
            return index < 0 ? data.length - 1 : index
          })

          break
        }
      }

      $.children.item(currentSelect)?.scrollIntoView({
        behavior: 'smooth',
      })
    },
    [data.length],
  )

  const isLogged = useIsLogged()

  return (
    <m.div
      className={clsx(
        'fixed inset-0 z-20 m-auto flex h-[32rem] max-h-[80vh] w-[40rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden',
        'rounded-2xl bg-gradient-to-b from-zinc-50/90 to-white/95 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md',
        'dark:from-zinc-900/90 dark:to-zinc-800/95 dark:shadow-zinc-950/30 dark:ring-zinc-100/10',
      )}
      onKeyDown={handleKeyDown}
      role="dialog"
      {...modalMontionConfig}
    >
      <input
        autoFocus
        className="w-full shrink-0 border-b border-zinc-900/10 bg-transparent px-5 py-4 text-base text-zinc-800 outline-none placeholder:text-zinc-400 dark:border-zinc-100/10 dark:text-zinc-100"
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
      <div />
      <m.div
        layoutScroll
        className="relative h-0 shrink grow overflow-x-hidden overflow-y-auto overscroll-y-contain"
      >
        <ul className="relative isolate h-full px-4 py-4" ref={listRef}>
          {data.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center">
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
            </div>
          ) : (
            data.map((item, index) => {
              return <SearchItem key={item.id} {...item} index={index} />
            })
          )}

          {data.length === 0 && isLoading && (
            <div className="center flex h-full grow">
              <div className="loading loading-spinner" />
            </div>
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
  )
}

const searchHighlightTransition = {
  layout: { type: 'spring' as const, stiffness: 680, damping: 32, mass: 0.35 },
  opacity: { duration: 0.12 },
  scale: { type: 'spring' as const, stiffness: 680, damping: 32, mass: 0.35 },
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
    <li
      className="relative flex w-full justify-between rounded-xl"
      key={item.id}
      onMouseOver={() => {
        startTransition(() => {
          jotaiStore.set(currentSelectAtom, index)
        })
      }}
    >
      <ArticleHoverHighlight
        layoutId="search-result-highlight"
        active={isSelect}
        transition={searchHighlightTransition}
        className="inset-1.5 z-0 rounded-xl"
      />
      <Link
        href={item.url}
        className="relative z-10 flex w-full items-center justify-between gap-4 p-3 text-sm text-zinc-800 dark:text-zinc-100"
      >
        <span className="block min-w-0 flex-1 shrink-0 truncate">
          {item.title}
        </span>
        <span className="block min-w-0 shrink-0 grow-0 text-xs text-zinc-400">
          {item.subtitle}
        </span>
      </Link>
    </li>
  )
})
