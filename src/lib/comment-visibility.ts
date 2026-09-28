import type { CommentModel, PaginateResult } from '@mx-space/api-client'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'

type CommentNode<T> = {
  id: string
  isDeleted?: boolean
  children?: T[]
  replies?: T[]
}

export const isDeletedComment = (comment: {
  id: string
  isDeleted?: boolean
}) => comment.isDeleted === true

// Keep live replies when their parent is a soft-deleted thread placeholder.
// This is a view of the raw cache, so new replies can still find their parent.
export const filterDeletedComments = <T extends CommentNode<T>>(
  comments: readonly T[],
): T[] =>
  comments.flatMap((comment) => {
    // Core v11 returns `replies`, while this theme and optimistic inserts use
    // `children`. Merge both, without rendering the same reply twice.
    const descendants = comment.replies
      ? [
          ...new Map(
            [...comment.replies, ...(comment.children || [])].map((reply) => [
              reply.id,
              reply,
            ]),
          ).values(),
        ]
      : comment.children
    const children = descendants
      ? filterDeletedComments(descendants)
      : undefined

    if (isDeletedComment(comment)) return children || []

    return [children ? { ...comment, children } : comment]
  })

export const markCommentDeleted = <T extends CommentNode<T>>(
  comments: readonly T[],
  id: string,
): T[] =>
  comments.map((comment) => {
    const children = comment.children
      ? markCommentDeleted(comment.children, id)
      : undefined

    const replies = comment.replies
      ? markCommentDeleted(comment.replies, id)
      : undefined

    return {
      ...comment,
      ...(children ? { children } : {}),
      ...(replies ? { replies } : {}),
      ...(comment.id === id ? { isDeleted: true } : {}),
    }
  })

export const hideDeletedComment = (queryClient: QueryClient, id: string) => {
  queryClient.setQueriesData<InfiniteData<PaginateResult<CommentModel>>>(
    { queryKey: ['comments'] },
    (cached) =>
      cached && {
        ...cached,
        pages: cached.pages.map((page) => ({
          ...page,
          data: markCommentDeleted(page.data, id),
        })),
      },
  )

  // The delete event only supplies an id, not the article ref. Refresh active
  // lists to also update admin rows and references to the deleted parent.
  queryClient.invalidateQueries({ queryKey: ['comments'] })
  queryClient.invalidateQueries({ queryKey: ['comment', 'admin'] })
}
