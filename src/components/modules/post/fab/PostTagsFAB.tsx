'use client'

import type { TagModel } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { LayoutGroup, m } from 'motion/react'
import Link from 'next/link'
import { memo, useCallback, useId, useState } from 'react'

import { EmptyIcon } from '~/components/icons/empty'
import { HoverHighlight } from '~/components/modules/post/PostItemHoverOverlay'
import {
  listContainerClassName,
  listLinkClassName,
  listScrollClassName,
} from '~/components/modules/shared/list-highlight-layout'
import { ListHighlightRow } from '~/components/modules/shared/ListHighlightRow'
import { FABPortable } from '~/components/ui/fab'
import { Loading } from '~/components/ui/loading'
import { useModalStack } from '~/components/ui/modal'
import { useSheetEntrance } from '~/components/ui/sheet/use-sheet-entrance'
import { useResetHover } from '~/hooks/common/use-reset-hover'
import { loadPublishedPostIds } from '~/lib/public-posts'
import {
  filterPublishedPosts,
  publicContentQueryOptions,
} from '~/lib/publication'
import { publicApiClient as apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

const previewModalClassName =
  'rounded-2xl border-zinc-900/5 bg-gradient-to-b from-zinc-50/95 to-white/95 p-1 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md dark:border-zinc-100/10 dark:from-zinc-900/95 dark:to-zinc-800/95 dark:shadow-none dark:ring-zinc-100/10'

export const tagDetailModalOptions = {
  sheet: { touchFriendly: true },
  modalClassName: `h-[min(32rem,80vh)] w-[40rem] max-h-[80vh] max-w-[calc(100vw-1.5rem)] lg:max-h-[80vh] lg:max-w-[calc(100vw-1.5rem)] ${previewModalClassName} border-0 p-0`,
  modalBodyClassName: 'flex flex-col overflow-hidden p-0',
  modalHeaderClassName:
    'shrink-0 border-b border-zinc-900/10 dark:border-zinc-100/10 [&>h2]:py-4 [&>button]:mr-3 [&>button]:flex [&>button]:size-8 [&>button]:items-center [&>button]:justify-center [&>button]:p-0',
  modalDividerClassName: 'hidden',
}

export const PostTagsFAB = () => {
  const { present } = useModalStack()
  return (
    <FABPortable
      onClick={() => {
        present({
          id: 'post-tag-cloud',
          content: TagsModal,
          clickOutsideToDismiss: true,
          overlay: true,
          title: '标签云',
          sheet: { touchFriendly: true },
          modalClassName: `w-[42rem] max-w-[calc(100vw-1.5rem)] ${previewModalClassName}`,
        })
      }}
    >
      <i className="i-mingcute-hashtag-line" />
    </FABPortable>
  )
}

const TagsModal = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['tags'],
    ...publicContentQueryOptions,
    queryFn: async () => {
      return (await apiClient.category.getAllTags()).data
    },
  })

  const { present } = useModalStack()
  const handleTagClick = useCallback(
    (tag: TagModel) => {
      present({
        id: `post-tag-${tag.name}`,
        content: () => <TagDetailModal {...tag} />,
        title: tag.name,
        ...tagDetailModalOptions,
        clickOutsideToDismiss: true,
        overlay: true,
      })
    },
    [present],
  )
  if (isLoading) return <Loading />
  if (!data) return <EmptyIcon />
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 touch-pan-y flex-wrap content-start gap-3 overflow-y-auto overscroll-contain px-1 py-4 lg:gap-2 lg:py-2">
        {data.map((tag, index) => {
          return (
            <TagInternal
              key={tag.name}
              {...tag}
              index={index + 1}
              onClick={handleTagClick}
            />
          )
        })}
      </div>
    </div>
  )
}

const TagInternal = memo(function TagInternal(
  props: TagModel & {
    onClick?: (tag: TagModel) => void
    index: number
  },
) {
  const { count, name } = props
  const entrance = useSheetEntrance(props.index)

  const [active, setActive] = useState(false)
  useResetHover(setActive)

  return (
    <m.button
      {...entrance}
      type="button"
      onClick={() => props.onClick?.(props)}
      onPointerEnter={(event) =>
        event.pointerType === 'mouse' && setActive(true)
      }
      onPointerLeave={() => setActive(false)}
      onFocus={(event) =>
        setActive(event.currentTarget.matches(':focus-visible'))
      }
      onBlur={() => setActive(false)}
      className={`relative inline-flex min-h-[44px] max-w-full touch-manipulation select-none items-center gap-2 rounded-full bg-zinc-900/[0.03] px-4 py-2.5 text-left text-[15px] text-zinc-700 ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-zinc-900/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:active:bg-white/10 lg:min-h-0 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-sm ${active ? 'ring-transparent' : 'ring-zinc-900/10 dark:ring-white/10'}`}
    >
      <HoverHighlight
        fade
        active={active}
        className="inset-0 z-0 rounded-full bg-accent"
      />
      <span
        className={`relative z-10 transition-colors duration-200 ${active ? 'text-accent-content' : ''}`}
      >
        {name}
      </span>
      {!!count && (
        <span
          className={`relative z-10 text-xs tabular-nums transition-colors duration-200 ${active ? 'text-accent-content/80' : 'text-zinc-400'}`}
        >
          {count}
        </span>
      )}
    </m.button>
  )
})

const TagPostRow = ({
  item,
  onOpen,
  index,
  active,
  onSelect,
}: {
  item: {
    id: string
    title: string
    slug: string
    created: string
    category: { slug: string }
  }
  onOpen: () => void
  index: number
  active: boolean
  onSelect: () => void
}) => {
  return (
    <ListHighlightRow
      active={active}
      index={index}
      layoutId="tag-post-highlight"
      onSelect={onSelect}
    >
      <Link
        onClick={onOpen}
        href={routeBuilder(Routes.Post, {
          category: item.category.slug,
          slug: item.slug,
        })}
        className={clsx(
          listLinkClassName,
          'items-center gap-3 text-[16px] text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-zinc-900/5 dark:text-zinc-100 dark:active:bg-white/5 lg:text-sm',
        )}
      >
        <span className="w-12 shrink-0 text-center text-xs tabular-nums text-zinc-400">
          {new Date(item.created)
            .toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
            })
            .replace('/', '·')}
        </span>
        <span className="line-clamp-2 min-w-0 flex-1 break-words leading-relaxed lg:block lg:truncate">
          {item.title}
        </span>
      </Link>
    </ListHighlightRow>
  )
}

export const TagDetailModal = (props: { name: string }) => {
  const { name } = props
  const entrance = useSheetEntrance()
  const layoutId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data, isLoading } = useQuery({
    queryKey: [name, 'tag'],
    queryFn: async ({ queryKey }) => {
      const [tagName] = queryKey
      const [result, ids] = await Promise.all([
        apiClient.category.getTagByName(tagName),
        loadPublishedPostIds(),
      ])
      return filterPublishedPosts(result.data, ids)
    },
    ...publicContentQueryOptions,
  })
  const { dismissAll } = useModalStack()
  if (isLoading)
    return (
      <p className="px-2 py-8 text-center text-sm text-zinc-400">正在读取…</p>
    )

  if (!data) return <EmptyIcon />

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <m.div {...entrance} className="mb-4 shrink-0 text-center lg:hidden">
        <span className="text-[13px] text-zinc-400">
          共 {data.length} 篇文稿
        </span>
      </m.div>
      <LayoutGroup id={layoutId}>
        <m.div layoutScroll className={listScrollClassName}>
          <ul className={listContainerClassName}>
            {[...data]
              .sort(
                (a, b) =>
                  new Date(b.created).getTime() - new Date(a.created).getTime(),
              )
              .map((item, index) => (
                <TagPostRow
                  key={item.id}
                  item={item}
                  index={index}
                  active={selectedIndex === index}
                  onSelect={() => setSelectedIndex(index)}
                  onOpen={() => {
                    dismissAll()
                  }}
                />
              ))}
            {data.length === 0 && (
              <li className="py-8 text-center text-[14px] text-zinc-400">
                该标签下暂无文稿
              </li>
            )}
          </ul>
        </m.div>
      </LayoutGroup>
    </div>
  )
}
