import type { QueryClient } from '@tanstack/react-query'

import type { PublicPost } from './public-posts'
import { invalidatePublishedPosts } from './public-posts'
import { isPublicContentQuery, pruneCachedPublicPosts } from './publication'

export const refreshPublicContent = (client: QueryClient) => {
  invalidatePublishedPosts()
  return client.invalidateQueries({
    predicate: (query) => isPublicContentQuery(query.queryKey),
  })
}

export const applyPublicPostSnapshot = (
  client: QueryClient,
  posts: PublicPost[],
) => {
  const ids = new Set(posts.map((post) => post.id))
  const paths = new Set(
    posts.map((post) => `/posts/${post.category?.slug}/${post.slug}`),
  )
  for (const query of client.getQueryCache().findAll({
    predicate: (query) => isPublicContentQuery(query.queryKey),
  })) {
    const postCollection =
      ['header-category-posts', 'public-post-index'].includes(
        String(query.queryKey[0]),
      ) || query.queryKey[1] === 'tag'
    client.setQueryData(query.queryKey, (cached: unknown) =>
      pruneCachedPublicPosts(cached, ids, paths, postCollection),
    )
  }
}

export const hideCachedPublicPost = (client: QueryClient, id: string) => {
  const posts = client.getQueryData<PublicPost[]>(['public-post-index'])
  if (posts)
    applyPublicPostSnapshot(
      client,
      posts.filter((post) => post.id !== id),
    )
}
