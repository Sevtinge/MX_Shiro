'use client'

import type { RoomsData } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'

import { PeekLink } from '~/components/modules/peek/PeekLink'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { loadPublishedPostIds } from '~/lib/public-posts'
import { publicContentQueryOptions } from '~/lib/publication'
import { publicApiClient as apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { getArticleRoomCount, isArticleRoomName } from '~/socket/rooms'

type ReadingRoom = {
  path: string
  title: string
  count: number
}

const unwrapRooms = (
  payload: RoomsData | { data?: RoomsData } | null | undefined,
): RoomsData | null => {
  if (!payload || typeof payload !== 'object') return null
  if ('objects' in payload && payload.objects) return payload
  if ('data' in payload && payload.data?.objects) return payload.data
  return null
}

const normalizeRooms = (payload: RoomsData | { data?: RoomsData }) => {
  const data = unwrapRooms(payload)
  if (!data) {
    return { rooms: [] as ReadingRoom[], unlistedReading: 0 }
  }
  const result: ReadingRoom[] = []
  data.objects.notes.forEach((note) => {
    result.push({
      path: routeBuilder(Routes.Note, { id: note.nid }),
      title: note.title,
      count: getArticleRoomCount(data.roomCount, note.id),
    })
  })
  data.objects.posts.forEach((post) => {
    result.push({
      path: routeBuilder(Routes.Post, {
        category: post.category.slug,
        slug: post.slug,
      }),
      title: post.title,
      count: getArticleRoomCount(data.roomCount, post.id),
    })
  })
  data.objects.pages.forEach((page) => {
    result.push({
      path: routeBuilder(Routes.Page, { slug: page.slug }),
      title: page.title,
      count: getArticleRoomCount(data.roomCount, page.id),
    })
  })
  const rooms = result
    .filter((room) => room.count > 0)
    .sort((a, b) => b.count - a.count)
  const totalReading = Object.entries(data.roomCount)
    .filter(([name]) => isArticleRoomName(name))
    .reduce((sum, [, count]) => sum + count, 0)
  return {
    rooms,
    unlistedReading: Math.max(
      0,
      totalReading - rooms.reduce((sum, room) => sum + room.count, 0),
    ),
  }
}

export const RoomsInfo = () => {
  const { data, isFetching, isError } = useQuery({
    queryKey: ['rooms'],
    refetchOnMount: true,
    refetchInterval: 5000,
    ...publicContentQueryOptions,
    queryFn: async () => {
      const [res, ids] = await Promise.all([
        apiClient.activity.getRoomsInfo(),
        loadPublishedPostIds(),
      ])
      const payload = unwrapRooms(res.$serialized)
      return normalizeRooms(
        payload
          ? {
              ...payload,
              objects: {
                ...payload.objects,
                posts: payload.objects.posts.filter((post) => ids.has(post.id)),
              },
            }
          : res.$serialized,
      )
    },
  })

  if (isError)
    return <div className="text-sm text-zinc-500">暂时无法获取阅览情况</div>
  if (!data)
    return (
      <div className="center flex h-8">
        <div className="loading loading-spinner loading-sm" />
      </div>
    )
  if (data.rooms.length === 0)
    return (
      <div className="text-sm text-zinc-500">
        {isFetching
          ? '正在更新阅览情况…'
          : data.unlistedReading > 0
            ? `有 ${data.unlistedReading} 位小伙伴在阅览其他文章`
            : '在线的小伙伴暂时没有在阅览文章'}
      </div>
    )
  return (
    <div>
      <ul className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
        {data.rooms.map((room) => (
          <li key={room.path}>
            <PeekLink
              href={room.path}
              title={room.title}
              className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-accent/5 hover:text-accent"
            >
              <span className="min-w-0 flex-1 truncate">{room.title}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-zinc-400">
                <i className="i-mingcute-eye-2-line" />
                <span className="relative inline-flex min-w-[1ch] justify-end tabular-nums">
                  <NumberSmoothTransition>{room.count}</NumberSmoothTransition>
                </span>
              </span>
            </PeekLink>
          </li>
        ))}
      </ul>
      {data.unlistedReading > 0 && (
        <div className="mt-2 text-sm text-zinc-500">
          另有 {data.unlistedReading} 位小伙伴在阅览其他文章
        </div>
      )}
    </div>
  )
}
