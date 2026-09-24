'use client'

import { useQuery } from '@tanstack/react-query'

import {
  useAggregationSelector,
  useAppConfigSelector,
} from '~/providers/root/aggregation-data-provider'

type Stats = {
  posts: number | null
  notes: number | null
  thoughts: number | null
  characters: number | null
  approximateCharacters: boolean
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN').format(value)
const formatCount = (value: number | null | undefined) =>
  value == null ? '—' : formatNumber(value)

export const SiteStats = () => {
  const foundedAt = useAppConfigSelector((config) => config.site.foundedAt)
  const footerDate = useAggregationSelector(
    (data) =>
      (data as typeof data & { theme?: AppThemeConfig }).theme?.footer
        ?.otherInfo?.date,
  )
  const {
    data: stats,
    isPending,
    isError,
  } = useQuery<Stats>({
    queryKey: ['public-site-stats', 'v2'],
    queryFn: async () => {
      const response = await fetch('/api/site-stats')
      if (!response.ok) throw new Error('Failed to load site statistics')
      return response.json()
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const startYear = footerDate?.match(/\d{4}/)?.[0]
  const startDate = foundedAt || (startYear ? `${startYear}-01-01` : null)
  const elapsedDays = startDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${startDate}T00:00:00`).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : null

  const unavailable =
    !isPending &&
    (isError ||
      (stats?.posts == null &&
        stats?.notes == null &&
        stats?.thoughts == null &&
        stats?.characters == null))

  const total =
    stats?.posts != null && stats.notes != null && stats.thoughts != null
      ? stats.posts + stats.notes + stats.thoughts
      : null

  return (
    <div
      className="mt-3 flex max-w-[90vw] flex-wrap justify-center gap-x-4 gap-y-1 rounded-xl bg-zinc-100/60 px-4 py-2 text-center font-mono text-sm font-medium leading-relaxed text-neutral-800 dark:bg-zinc-800/50 dark:text-neutral-200"
      aria-live="polite"
    >
      <span>文稿 {formatCount(stats?.posts)} 篇</span>
      <span>手记 {formatCount(stats?.notes)} 篇</span>
      <span>思考 {formatCount(stats?.thoughts)} 篇</span>
      <span>
        共 {formatCount(total)} 篇 ·{' '}
        {stats?.characters == null
          ? isPending
            ? '字数计算中…'
            : '字数暂不可用'
          : `${stats.approximateCharacters ? '约 ' : ''}${formatNumber(stats.characters)} 字`}
      </span>
      {isPending && <span>统计加载中…</span>}
      {unavailable && <span>统计暂不可用</span>}
      {elapsedDays !== null && !Number.isNaN(elapsedDays) ? (
        <span>
          {foundedAt ? '建站' : '建站约'} {formatNumber(elapsedDays)} 天
        </span>
      ) : (
        <span>建站天数待设置</span>
      )}
    </div>
  )
}
