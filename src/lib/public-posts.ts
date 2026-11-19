import type { PostModel, TimelineType } from '@mx-space/api-client'
import { RequestError } from '@mx-space/api-client'

import { filterPublishedPosts, isPublished } from './publication'
import { publicApiClient as apiClient } from './request'

export type PublicPost = Pick<
  PostModel,
  'id' | 'title' | 'slug' | 'created' | 'modified' | 'category' | 'categoryId'
>

let pending: Promise<PublicPost[]> | undefined
let generation = 0

export const invalidatePublishedPosts = () => {
  generation += 1
  pending = undefined
}

// Coalesce concurrent category/preview requests, never retain a successful
// snapshot for the rest of a visitor's session. All pages are read anonymously.
export const loadPublishedPosts = (): Promise<PublicPost[]> => {
  if (pending) return pending
  const currentGeneration = generation
  const request = (async () => {
    const posts: PublicPost[] = []
    for (let page = 1; ; page += 1) {
      const result = await apiClient.post.getList(page, 50, {
        select: [
          'id',
          'title',
          'slug',
          'created',
          'modified',
          'category',
          'categoryId',
          'isPublished' as keyof PostModel,
        ],
      })
      posts.push(...result.data.filter(isPublished))
      if (!result.pagination.hasNextPage) break
      if (result.data.length === 0) throw new Error('文章分页未完整返回')
    }
    return [...new Map(posts.map((post) => [post.id, post])).values()]
  })()
  pending = request
  const clear = () => {
    if (generation === currentGeneration && pending === request)
      pending = undefined
  }
  void request.then(clear, clear)
  return request
}

export const loadPublishedPostIds = async () =>
  new Set((await loadPublishedPosts()).map((post) => post.id))

export const getPublicPost = async (category: string, slug: string) => {
  const [post, ids] = await Promise.all([
    apiClient.post.getPost(category, slug),
    loadPublishedPostIds(),
  ])
  if (!ids.has(post.id) || !isPublished(post)) {
    throw new RequestError(
      '文章未发布',
      404,
      `/posts/${category}/${slug}`,
      post.$raw,
    )
  }
  return {
    ...post.$serialized,
    related: post.related && filterPublishedPosts(post.related, ids),
  }
}

export const getPublicCategory = async (slug: string) => {
  const [category, ids] = await Promise.all([
    apiClient.category.getCategoryByIdOrSlug(slug),
    loadPublishedPostIds(),
  ])
  return {
    ...category,
    children: filterPublishedPosts(category.children ?? [], ids),
  }
}

export const getPublicTop = async (size: number) => {
  const [result, ids] = await Promise.all([
    apiClient.aggregate.getTop(size),
    loadPublishedPostIds(),
  ])
  return {
    ...result.$serialized,
    posts: filterPublishedPosts(result.posts, ids),
  }
}

export const getPublicTimeline = async (options: {
  type?: TimelineType
  year?: number
}) => {
  const [result, ids] = await Promise.all([
    apiClient.aggregate.getTimeline(options),
    loadPublishedPostIds(),
  ])
  return {
    ...result.data,
    posts: result.data.posts && filterPublishedPosts(result.data.posts, ids),
  }
}

export const filterPublicPostLinks = async <
  T extends { url?: string; link?: string },
>(
  items: T[],
) => {
  const posts = await loadPublishedPosts()
  const paths = new Set(
    posts.map((post) => `/posts/${post.category.slug}/${post.slug}`),
  )
  return items.filter((item) => {
    const path = new URL(
      item.url || item.link || '/',
      'https://public.invalid',
    ).pathname.replace(/\/$/, '')
    return !path.startsWith('/posts/') || paths.has(decodeURI(path))
  })
}
