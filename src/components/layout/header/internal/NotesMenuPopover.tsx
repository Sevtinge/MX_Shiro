'use client'

import { useQuery } from '@tanstack/react-query'
import { memo, useState } from 'react'

import type { IHeaderMenu } from '../config'
import { loadNoteMenu } from './note-preview'
import { PreviewMenuShell } from './PreviewMenuShell'

export const NotesMenuPopover: Component<{
  subMenu?: IHeaderMenu['subMenu']
  embedded?: boolean
}> = memo(({ children, embedded = false }) => {
  const [open, setOpen] = useState(embedded)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['header-note-menu'],
    queryFn: loadNoteMenu,
    enabled: embedded || open,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const sections = (data?.topics ?? []).map((topic) => ({
    id: topic.slug,
    title: topic.name,
    href: `/notes/topics/${topic.slug}`,
  }))
  const resolvedId = sections.some((section) => section.id === activeId)
    ? activeId
    : (sections[0]?.id ?? null)
  const active = sections.find((section) => section.id === resolvedId)
  const items = (resolvedId && data?.items[resolvedId]) || []

  return (
    <PreviewMenuShell
      embedded={embedded}
      label="手记"
      sections={sections}
      activeId={resolvedId}
      onActive={setActiveId}
      sectionHeading="专栏"
      recentHeading={active ? `${active.title} · 最近` : '近期手记'}
      items={items}
      status={
        isLoading
          ? 'loading'
          : isError
            ? 'error'
            : items.length
              ? 'ready'
              : 'empty'
      }
      emptyText="这个专栏还没有手记"
      emptySectionText="暂时安静"
      errorText="暂时读不到手记"
      footerHref="/notes"
      footerLabel="查看全部手记"
      secondaryFooterHref="/notes/topics"
      secondaryFooterLabel="全部专栏"
      open={open}
      onOpenChange={setOpen}
    >
      {children}
    </PreviewMenuShell>
  )
})
NotesMenuPopover.displayName = 'NotesMenuPopover'
