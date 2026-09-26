// Must match the gateway's buildArticleRoomName (activity.util.ts).
const articleRoomPrefix = 'article-'

export const getArticleRoomName = (id: string) => `${articleRoomPrefix}${id}`

export const isArticleRoomName = (roomName: string) =>
  roomName.startsWith(articleRoomPrefix)

export const getArticleRoomCount = (
  roomCount: Record<string, number>,
  id: string,
) => roomCount[getArticleRoomName(id)] || 0
