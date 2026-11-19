'use client'

import { useQuery } from '@tanstack/react-query'
import { memo, useState } from 'react'

import { publicContentQueryOptions } from '~/lib/publication'

import type { IHeaderMenu } from '../config'
import { PreviewMenuShell } from './PreviewMenuShell'
import { loadTimelineMenu } from './timeline-preview'

const sections = [
  { id: 'note', title: '手记', href: '/timeline?type=note' },
  { id: 'post', title: '文稿', href: '/timeline?type=post' },
  { id: 'memory', title: '回忆', href: '/timeline?memory=1' },
] as const

export const TimelineMenuPopover: Component<{
  subMenu?: IHeaderMenu['subMenu']
  embedded?: boolean
}> = memo(({ children, embedded = false }) => {
  const [open, setOpen] = useState(embedded)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['header-timeline-menu'],
    queryFn: loadTimelineMenu,
    enabled: embedded || open,
    ...publicContentQueryOptions,
  })
  const resolvedId = sections.some((section) => section.id === activeId)
    ? activeId
    : sections[0].id
  const active =
    sections.find((section) => section.id === resolvedId) ?? sections[0]
  const items = data?.[active.id] ?? []

  return (
    <PreviewMenuShell
      embedded={embedded}
      label="时光"
      sections={[...sections]}
      activeId={resolvedId}
      onActive={setActiveId}
      sectionHeading="分类"
      recentHeading={`${active.title} · 最近`}
      items={items}
      status={
        isLoading
          ? 'loading'
          : isError
            ? 'error'
            : items.length > 0
              ? 'ready'
              : 'empty'
      }
      emptyText={
        active.id === 'memory' ? '还没有标成回忆的手记' : '这里还没有内容'
      }
      errorText="暂时读不到时光"
      footerHref="/timeline"
      footerLabel="查看时光"
      open={open}
      onOpenChange={setOpen}
    >
      {children}
    </PreviewMenuShell>
  )
})
TimelineMenuPopover.displayName = 'TimelineMenuPopover'
