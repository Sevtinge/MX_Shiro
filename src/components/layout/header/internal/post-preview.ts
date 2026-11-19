import dayjs from 'dayjs'

import { loadPublishedPosts } from '~/lib/public-posts'

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
  return (await loadPublishedPosts())
    .filter((post) => post.category?.slug === slug)
    .sort((a, b) => +new Date(b.created || 0) - +new Date(a.created || 0))
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      created: post.created,
    }))
}

export { loadPublishedPostIds } from '~/lib/public-posts'
