'use client'

import { useQuery } from '@tanstack/react-query'

import { PeekLink } from '~/components/modules/peek/PeekLink'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { getArticleRoomCount, isArticleRoomName } from '~/socket/rooms'

// Kept for when the per-article reader popover is re-enabled.
export const RoomsInfo = () => {
  const { data, isFetching, isError } = useQuery({
    queryKey: ['rooms'],
    refetchOnMount: true,
    staleTime: 1000 * 10,
    queryFn: async () => {
      const res = await apiClient.activity.getRoomsInfo()
      const data = res.$serialized
      const result = [] as {
        path: string
        title: string
        count: number
      }[]
      data.objects.notes.forEach((note) => {
        result.push({
          path: routeBuilder(Routes.Note, {
            id: note.nid,
          }),
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
          path: routeBuilder(Routes.Page, {
            slug: page.slug,
          }),
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
    },
  })

  if (isError) return <div className="text-gray-500">暂时无法获取阅览情况</div>
  if (!data)
    return (
      <div className="center flex size-6">
        <div className="loading loading-spinner" />
      </div>
    )
  if (data.rooms.length === 0)
    return (
      <div className="text-gray-500">
        {isFetching
          ? '正在更新阅览情况…'
          : data.unlistedReading > 0
            ? `有 ${data.unlistedReading} 位小伙伴在阅览其他文章`
            : '在线的小伙伴暂时没有在阅览文章哦~'}
      </div>
    )
  return (
    <div className="lg:max-w-[400px]">
      <div className="mb-2 text-sm font-medium">下面的内容正在被看爆：</div>
      <ul className="flex flex-col justify-between gap-2">
        {data.rooms.map((room) => (
          <li key={room.path} className="flex items-center justify-between">
            <PeekLink href={room.path} className="hover:underline">
              {room.title}
            </PeekLink>
            {!!room.count && (
              <span className="ml-5 inline-flex items-center text-sm text-gray-500">
                <i className="i-mingcute-user-visible-line" /> {room.count}
              </span>
            )}
          </li>
        ))}
      </ul>
      {data.unlistedReading > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          另有 {data.unlistedReading} 位小伙伴在阅览其他文章
        </div>
      )}
    </div>
  )
}
