// Must match the gateway's buildArticleRoomName (activity.util.ts).
const articleRoomPrefix = 'article-'

// The API client camelcases every object key. Room names such as
// `article-preview-post` or `article-a0...` lose their hyphens in $serialized.
const camelcaseRoomKey = (value: string) =>
  value
    .replace(/^_+/, '')
    .replaceAll(/([_-][a-z])/gi, (match) =>
      match.toUpperCase().replaceAll('-', '').replaceAll('_', ''),
    )

export const getArticleRoomName = (id: string) => `${articleRoomPrefix}${id}`

export const isArticleRoomName = (roomName: string) =>
  roomName.startsWith(articleRoomPrefix) || /^article[A-Z0-9]/.test(roomName)

export const getArticleRoomCount = (
  roomCount: Record<string, number>,
  id: string,
) => {
  const roomName = getArticleRoomName(id)
  return roomCount[roomName] || roomCount[camelcaseRoomKey(roomName)] || 0
}
