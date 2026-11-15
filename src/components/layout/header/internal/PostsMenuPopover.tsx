'use client'

import type { CategoryModel } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { RootPortal } from '~/components/ui/portal'
import { microReboundPreset } from '~/constants/spring'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'
import { queryClient } from '~/providers/root/react-query-provider'

import type { IHeaderMenu } from '../config'
import { useNavPreview } from './nav-preview-context'
import { loadCategoryPreviewPosts } from './post-preview'
import { previewGridStyle } from './preview-layout'
import { EntryList, PreviewRail } from './PreviewMenuShell'

const panelWidth = 720
const noCategories: CategoryModel[] = []

const usePreviewCategories = () => {
  const categories = useAggregationSelector((data) => data.categories)
  const { data: fallbackCategories } = useQuery({
    queryKey: ['header-categories'],
    queryFn: async () => (await apiClient.category.getAllCategories()).data,
    enabled: !categories?.length,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  if (categories?.length) return categories
  return fallbackCategories ?? noCategories
}

export const PostsMenuPopover: Component<{
  subMenu: IHeaderMenu['subMenu']
  embedded?: boolean
}> = memo(({ children, subMenu, embedded = false }) => {
  const categories = usePreviewCategories()
  const navPreview = useNavPreview()
  const dismiss = () => {
    setOpen(false)
    if (embedded) navPreview?.close()
  }
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(embedded)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: panelWidth,
  })
  const resolvedActiveSlug = categories.some(
    (category) => category.slug === activeSlug,
  )
    ? activeSlug
    : (categories[0]?.slug ?? null)
  const activeCategory =
    categories.find((category) => category.slug === resolvedActiveSlug) ?? null
  const total = categories.reduce(
    (sum, category) => sum + (category.count || 0),
    0,
  )

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const closeSoon = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(dismiss, 200)
  }, [cancelClose])
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(panelWidth, window.innerWidth - 24)
    const preferredLeft = rect.left + rect.width / 2 - width / 2
    setPosition({
      top: rect.bottom + 10,
      left: Math.max(
        12,
        Math.min(preferredLeft, window.innerWidth - width - 12),
      ),
      width,
    })
  }, [])
  const show = useCallback(() => {
    cancelClose()
    updatePosition()
    setOpen(true)
  }, [cancelClose, updatePosition])

  useEffect(() => cancelClose, [cancelClose])
  useEffect(() => {
    if (!embedded && !open) return
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])
  useEffect(() => {
    if (!embedded && !open) return
    for (const category of categories) {
      void queryClient.prefetchQuery({
        queryKey: ['header-category-posts', category.slug],
        queryFn: () => loadCategoryPreviewPosts(category.slug),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [categories, embedded, open])

  if (!embedded && !subMenu?.length && categories.length === 0) return children

  if (embedded) {
    return (
      <PostsPreviewBody
        categories={categories}
        resolvedActiveSlug={resolvedActiveSlug}
        setActiveSlug={setActiveSlug}
        activeCategory={activeCategory}
        total={total}
        dismiss={dismiss}
      />
    )
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={show}
        onMouseLeave={closeSoon}
        onFocusCapture={show}
        onBlurCapture={closeSoon}
      >
        {children}
      </div>
      <RootPortal>
        <AnimatePresence>
          {open && categories.length > 0 && (
            <m.div
              role="menu"
              aria-label="文稿分类"
              className="fixed z-[99] overflow-hidden rounded-xl border border-zinc-900/5 bg-white/95 shadow-lg shadow-zinc-800/10 backdrop-blur-md dark:border-zinc-100/10 dark:bg-neutral-900/95"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
              }}
              initial={{ y: 10, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{
                y: 8,
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.16 },
              }}
              transition={microReboundPreset}
              onMouseEnter={cancelClose}
              onMouseLeave={closeSoon}
              onFocusCapture={cancelClose}
              onBlurCapture={closeSoon}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false)
                  triggerRef.current?.querySelector('a')?.focus()
                }
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                event.preventDefault()
                const index = categories.findIndex(
                  (category) => category.slug === resolvedActiveSlug,
                )
                const next =
                  event.key === 'ArrowDown'
                    ? categories[(index + 1) % categories.length]
                    : categories[
                        (index - 1 + categories.length) % categories.length
                      ]
                if (next) setActiveSlug(next.slug)
              }}
            >
              <PostsPreviewBody
                categories={categories}
                resolvedActiveSlug={resolvedActiveSlug}
                setActiveSlug={setActiveSlug}
                activeCategory={activeCategory}
                total={total}
                dismiss={dismiss}
              />
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </>
  )
})
PostsMenuPopover.displayName = 'PostsMenuPopover'

const RecentPosts = ({
  slug,
  onNavigate,
}: {
  slug: string | null
  onNavigate: () => void
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['header-category-posts', slug],
    queryFn: () => loadCategoryPreviewPosts(slug || ''),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  return (
    <EntryList
      items={(data ?? []).map((post) => ({
        id: post.id,
        title: post.title,
        href: routeBuilder(Routes.Post, {
          category: slug || '',
          slug: post.slug,
        }),
        created: post.created,
      }))}
      listKey={slug || 'posts'}
      status={!slug || isLoading ? 'loading' : isError ? 'error' : 'ready'}
      emptyText="这个分类还没有文章"
      errorText="暂时读不到这个分类的文章"
      onNavigate={onNavigate}
    />
  )
}

const PostsPreviewBody = ({
  categories,
  resolvedActiveSlug,
  setActiveSlug,
  activeCategory,
  total,
  dismiss,
}: {
  categories: CategoryModel[]
  resolvedActiveSlug: string | null
  setActiveSlug: (slug: string) => void
  activeCategory: CategoryModel | null
  total: number
  dismiss: () => void
}) => (
  <>
    <div className="grid w-max" style={previewGridStyle}>
      <PreviewRail
        heading="分类"
        sections={categories.map((category) => ({
          id: category.slug,
          title: category.name,
          href: `/categories/${category.slug}`,
          count: category.count || 0,
        }))}
        activeId={resolvedActiveSlug}
        onActive={setActiveSlug}
        onNavigate={dismiss}
      />
      <div className="min-w-0 py-3">
        <div className="px-5 pb-2 pt-1 text-xs text-zinc-400">
          {activeCategory ? (
            <Link
              href={`/categories/${activeCategory.slug}`}
              className="text-zinc-700 transition-colors hover:text-accent dark:text-zinc-200"
              onClick={dismiss}
            >
              {activeCategory.name}
            </Link>
          ) : (
            <span>最近</span>
          )}
          <span> · 最近</span>
        </div>
        <RecentPosts slug={resolvedActiveSlug} onNavigate={dismiss} />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-zinc-900/10 px-5 py-3.5 text-sm dark:border-zinc-100/10">
      <Link
        href="/posts"
        className="text-zinc-700 transition-colors hover:text-accent dark:text-zinc-200"
        onClick={dismiss}
      >
        查看全部文稿
        <span aria-hidden="true"> →</span>
      </Link>
      <span className="tabular-nums text-zinc-400">{total} 篇文稿</span>
    </div>
  </>
)
