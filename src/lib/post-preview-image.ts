import type { PostModel } from '@mx-space/api-client'

export const getPostPreviewImage = (post: Pick<PostModel, 'meta' | 'images'>) =>
  post.meta?.cover?.trim() || post.images?.[0]?.src || null
