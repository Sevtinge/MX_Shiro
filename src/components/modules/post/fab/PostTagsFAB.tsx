'use client'

import type { TagModel } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { memo, useCallback, useState } from 'react'

import { EmptyIcon } from '~/components/icons/empty'
import { HoverHighlight } from '~/components/modules/post/PostItemHoverOverlay'
import { FABPortable } from '~/components/ui/fab'
import { Loading } from '~/components/ui/loading'
import { useModalStack } from '~/components/ui/modal'
import { useResetHover } from '~/hooks/common/use-reset-hover'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

const previewModalClassName =
  'rounded-2xl border-zinc-900/5 bg-gradient-to-b from-zinc-50/95 to-white/95 p-1 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md dark:border-zinc-100/10 dark:from-zinc-900/95 dark:to-zinc-800/95 dark:shadow-none dark:ring-zinc-100/10'

export const PostTagsFAB = () => {
  const { present } = useModalStack()
  return (
    <FABPortable
      onClick={() => {
        present({
          content: TagsModal,
          clickOutsideToDismiss: true,
          overlay: true,
          title: '标签云',
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
    queryFn: async () => {
      return (await apiClient.category.getAllTags()).data
    },
  })

  const { present } = useModalStack()
  const handleTagClick = useCallback((tag: TagModel) => {
    present({
      content: () => <TagDetailModal {...tag} />,
      title: tag.name,
      clickOutsideToDismiss: true,
      overlay: true,
      modalClassName: `w-[28rem] max-w-[calc(100vw-1.5rem)] ${previewModalClassName}`,
    })
  }, [])
  if (isLoading) return <Loading />
  if (!data) return <EmptyIcon />
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((tag) => {
        return <TagInternal key={tag.name} {...tag} onClick={handleTagClick} />
      })}
    </div>
  )
}

const TagInternal = memo(function TagInternal(
  props: TagModel & {
    onClick?: (tag: TagModel) => void
  },
) {
  const { count, name } = props

  const [active, setActive] = useState(false)
  useResetHover(setActive)

  return (
    <button
      type="button"
      onClick={() => props.onClick?.(props)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={`relative inline-flex items-center gap-1.5 rounded-full bg-zinc-900/[0.03] px-3 py-1.5 text-sm text-zinc-700 ring-1 transition-colors dark:bg-white/[0.04] dark:text-zinc-200 ${active ? 'ring-transparent' : 'ring-zinc-900/10 dark:ring-white/10'}`}
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
    </button>
  )
})

const TagPostRow = ({
  item,
  onOpen,
}: {
  item: {
    id: string
    title: string
    slug: string
    created: string
    category: { slug: string }
  }
  onOpen: () => void
}) => {
  const [active, setActive] = useState(false)
  useResetHover(setActive)
  return (
    <li
      className="relative"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <HoverHighlight
        layoutId="tag-post-highlight"
        active={active}
        className="inset-0 z-0 rounded-xl bg-accent/10 dark:bg-neutral-800"
      />
      <Link
        onClick={onOpen}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        href={routeBuilder(Routes.Post, {
          category: item.category.slug,
          slug: item.slug,
        })}
        className="relative z-10 flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-zinc-700 dark:text-zinc-200"
      >
        <span className="w-12 shrink-0 text-center text-xs tabular-nums text-zinc-400">
          {new Date(item.created)
            .toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
            })
            .replace('/', '·')}
        </span>
        <span className="min-w-0 truncate">{item.title}</span>
      </Link>
    </li>
  )
}

export const TagDetailModal = (props: { name: string }) => {
  const { name } = props
  const { data, isLoading } = useQuery({
    queryKey: [name, 'tag'],
    queryFn: async ({ queryKey }) => {
      const [tagName] = queryKey
      return (await apiClient.category.getTagByName(tagName)).data
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
  const { dismissAll } = useModalStack()
  if (isLoading)
    return (
      <p className="px-2 py-8 text-center text-sm text-zinc-400">正在读取…</p>
    )

  if (!data) return <EmptyIcon />

  return (
    <ul className="space-y-1">
      {data
        .sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        )
        .map((item) => (
          <TagPostRow
            key={item.id}
            item={item}
            onOpen={() => {
              dismissAll()
            }}
          />
        ))}
    </ul>
  )
}
