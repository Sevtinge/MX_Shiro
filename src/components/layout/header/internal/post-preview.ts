import dayjs from 'dayjs'

import { apiClient } from '~/lib/request'

import { isPublishedPreviewItem } from './published-preview'

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
  const detail = await apiClient.category.getCategoryByIdOrSlug(slug)
  const wrapped = detail as { data?: { children?: typeof detail.children } }
  const children = detail.children ?? wrapped.data?.children ?? []
  return [...children]
    .filter(isPublishedPreviewItem)
    .sort((a, b) => +new Date(b.created || 0) - +new Date(a.created || 0))
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      created: post.created,
    }))
}
