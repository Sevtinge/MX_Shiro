// Must match the gateway's buildArticleRoomName (activity.util.ts).
const articleRoomPrefix = 'article-'

// The API client camelcases object keys, and the live rooms payload stores
// counts under underscore keys (`article_<id>`) while the room list uses
// hyphens (`article-<id>`).
const camelcaseRoomKey = (value: string) =>
  value
    .replace(/^_+/, '')
    .replaceAll(/([_-][a-z])/gi, (match) =>
      match.toUpperCase().replaceAll('-', '').replaceAll('_', ''),
    )

export const getArticleRoomName = (id: string) => `${articleRoomPrefix}${id}`

const articleRoomKeys = (id: string) => {
  const hyphen = getArticleRoomName(id)
  const underscore = `article_${id}`
  return [
    hyphen,
    underscore,
    camelcaseRoomKey(hyphen),
    camelcaseRoomKey(underscore),
  ]
}

export const isArticleRoomName = (roomName: string) =>
  roomName.startsWith(articleRoomPrefix) ||
  roomName.startsWith('article_') ||
  /^article[A-Z0-9]/.test(roomName)

export const getArticleRoomCount = (
  roomCount: Record<string, number>,
  id: string,
) => {
  for (const key of articleRoomKeys(id)) {
    const count = roomCount[key]
    if (count) return count
  }
  return 0
}
