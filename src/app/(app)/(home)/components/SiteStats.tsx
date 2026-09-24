'use client'

import { useQuery } from '@tanstack/react-query'

import {
  useAggregationSelector,
  useAppConfigSelector,
} from '~/providers/root/aggregation-data-provider'

type Stats = {
  posts: number
  notes: number
  thoughts: number
  characters: number
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN').format(value)

export const SiteStats = () => {
  const foundedAt = useAppConfigSelector((config) => config.site.foundedAt)
  const footerDate = useAggregationSelector(
    (data) =>
      (data as typeof data & { theme?: AppThemeConfig }).theme?.footer
        ?.otherInfo?.date,
  )
  const { data: stats } = useQuery<Stats>({
    queryKey: ['public-site-stats'],
    queryFn: async () => {
      const response = await fetch('/api/site-stats')
      if (!response.ok) throw new Error('Failed to load site statistics')
      return response.json()
    },
    staleTime: 1000 * 60 * 60,
  })

  const startYear = footerDate?.match(/\d{4}/)?.[0]
  const elapsedDays = foundedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${foundedAt}T00:00:00`).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : null

  const approximateYears = startYear
    ? Math.max(0, new Date().getFullYear() - Number(startYear))
    : null

  if (!stats && elapsedDays === null && approximateYears === null) return null

  return (
    <div className="mt-3 flex max-w-[90vw] flex-wrap justify-center gap-x-3 gap-y-1 text-center font-mono text-xs leading-relaxed opacity-75">
      {stats && (
        <>
          <span>文稿 {formatNumber(stats.posts)} 篇</span>
          <span>手记 {formatNumber(stats.notes)} 篇</span>
          <span>思考 {formatNumber(stats.thoughts)} 篇</span>
          <span>
            共 {formatNumber(stats.posts + stats.notes + stats.thoughts)} 篇 ·{' '}
            {formatNumber(stats.characters)} 字
          </span>
        </>
      )}
      {elapsedDays !== null && !Number.isNaN(elapsedDays) ? (
        <span>建站 {formatNumber(elapsedDays)} 天</span>
      ) : approximateYears !== null ? (
        <span>建站约 {formatNumber(approximateYears)} 年</span>
      ) : null}
    </div>
  )
}
