import type { RecentComment } from '@mx-space/api-client'

type CommentActivity = RecentComment & { isDeleted?: boolean }

export const isDeletedCommentActivity = (comment: CommentActivity) => {
  if (typeof comment.isDeleted === 'boolean') return comment.isDeleted

  // Core v11's activity projection omits isDeleted and exposes the article
  // id rather than the comment id. Only this feed needs the exact tombstone
  // text fallback; regular comment lists continue to use the deletion flag.
  return (
    typeof comment.text === 'string' && comment.text.trim() === '该评论已删除'
  )
}

export const filterDeletedCommentActivities = <
  T extends { comment?: readonly CommentActivity[] },
>(
  activities: T,
): T =>
  activities.comment
    ? {
        ...activities,
        comment: activities.comment.filter(
          (comment) => !isDeletedCommentActivity(comment),
        ),
      }
    : activities
