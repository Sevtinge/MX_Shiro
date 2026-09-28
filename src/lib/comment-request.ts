import type { CommentModel, HTTPClient } from '@mx-space/api-client'

export interface CommentSubmission {
  refId: string
  text: string
  isReply?: boolean
  isOwner?: boolean
  isReader?: boolean
  isWhispers?: boolean
  author?: string
  mail?: string
  url?: string
  avatar?: string
}

export const submitComment = (
  client: Pick<HTTPClient, 'proxy'>,
  submission: CommentSubmission,
) => {
  const { refId, text, isReply, isOwner, isReader, isWhispers } = submission
  const isGuest = !isOwner && !isReader

  // Core v11 separates guest and authenticated submissions. Owner comments
  // use the reader route; only owner replies have a dedicated admin route.
  const path = isReply
    ? isOwner
      ? 'owner-reply'
      : isGuest
        ? 'guest/reply'
        : 'reader/reply'
    : isGuest
      ? 'guest'
      : 'reader'

  const data: Omit<
    CommentSubmission,
    'refId' | 'isReply' | 'isOwner' | 'isReader'
  > = {
    text,
  }

  if (isGuest) {
    data.author = submission.author || ''
    data.mail = submission.mail || ''
    if (submission.url) data.url = submission.url
    if (submission.avatar) data.avatar = submission.avatar
  }

  // Only new comments expose the whisper option. Authenticated identities are
  // resolved by the server, not from locally cached guest profile fields.
  if (!isReply && !isOwner && isWhispers !== undefined) {
    data.isWhispers = isWhispers
  }

  return client.proxy.comments(path)(refId).post<CommentModel>({ data })
}
