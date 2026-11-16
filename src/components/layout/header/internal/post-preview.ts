import dayjs from 'dayjs'

import { apiClient } from '~/lib/request'

import {
  filterToPublishedIds,
  isPublishedPreviewItem,
} from './published-preview'

export type CategoryPreviewPost = {
  id: string
  title: string
  slug: string
  created: string
}

export const formatCategoryPreviewDate = (created: string) => {
  const parsed = dayjs(created)
  return parsed.isValid() ? parsed.format('MM·DD') : ''
}

export async function loadCategoryPreviewPosts(
  slug: string,
): Promise<CategoryPreviewPost[]> {
  const [detail, publishedIds] = await Promise.all([
    apiClient.category.getCategoryByIdOrSlug(slug),
    loadPublishedPostIds(),
  ])
  const wrapped = detail as { data?: { children?: typeof detail.children } }
  const children = detail.children ?? wrapped.data?.children ?? []
  // Category payloads omit isPublished and still include drafts such as
  // /posts/default/test. The public post list is the published set.
  return filterToPublishedIds([...children], publishedIds)
    .sort((a, b) => +new Date(b.created || 0) - +new Date(a.created || 0))
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      created: post.created,
    }))
}

let publishedPostIdsPromise: Promise<Set<string>> | null = null

const pageHasNext = (pagination: {
  hasNextPage?: boolean
  has_next_page?: boolean
} | null | undefined) =>
  Boolean(pagination?.hasNextPage ?? pagination?.has_next_page)

export async function loadPublishedPostIds() {
  if (!publishedPostIdsPromise) {
    publishedPostIdsPromise = fetchPublishedPostIds().catch((error) => {
      publishedPostIdsPromise = null
      throw error
    })
  }
  return publishedPostIdsPromise
}

async function fetchPublishedPostIds() {
  const ids = new Set<string>()
  for (let page = 1; page <= 20; page += 1) {
    const result = await apiClient.post.getList(page, 50, {
      select: ['id', 'isPublished'],
    })
    const rows = (result.data ?? []) as Array<{ id?: string }>
    for (const row of rows) {
      if (row.id && isPublishedPreviewItem(row)) ids.add(row.id)
    }
    if (!pageHasNext(result.pagination)) break
  }
  return ids
}
