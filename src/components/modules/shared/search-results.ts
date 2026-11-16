export type SearchListType = {
  title: string
  subtitle?: string
  url: string
  id: string
}

type SearchRow = {
  type?: string
  id?: string
  title?: string
  slug?: string
  nid?: number | string
  category?: { name?: string; slug?: string } | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object'

const rowsFrom = (payload: unknown): SearchRow[] | null => {
  if (!isRecord(payload)) return null
  if (Array.isArray(payload.data)) return payload.data as SearchRow[]
  if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
    return payload.data.data as SearchRow[]
  }
  return null
}

const mapTypedRow = (item: SearchRow): SearchListType | null => {
  if (!item?.id || !item.title) return null
  if (item.type === 'post') {
    const categorySlug = item.category?.slug
    if (!item.slug || !categorySlug) return null
    return {
      title: item.title,
      subtitle: item.category?.name || '文稿',
      id: `post-${item.id}`,
      url: `/posts/${categorySlug}/${item.slug}`,
    }
  }
  if (item.type === 'note') {
    if (item.nid == null || item.nid === '') return null
    return {
      title: item.title,
      subtitle: '手记',
      id: `note-${item.id}`,
      url: `/notes/${item.nid}`,
    }
  }
  if (item.type === 'page') {
    if (!item.slug) return null
    return {
      title: item.title,
      subtitle: '页面',
      id: `page-${item.id}`,
      url: `/${item.slug}`,
    }
  }
  return null
}

/** Returns null when the payload is an error, not an Algolia result list. */
export const mapAlgoliaPayload = (
  payload: unknown,
): SearchListType[] | null => {
  if (!isRecord(payload)) return null
  if (payload.ok === 0 || 'code' in payload) return null
  const rows = rowsFrom(payload)
  if (!rows) return null
  return rows.flatMap((item) => {
    const mapped = mapTypedRow(item)
    return mapped ? [mapped] : []
  })
}

export const mapDatabaseSearch = (
  postsPayload: unknown,
  notesPayload: unknown,
): SearchListType[] => {
  const posts = rowsFrom(postsPayload) ?? []
  const notes = rowsFrom(notesPayload) ?? []
  return [
    ...posts.flatMap((item) => {
      const mapped = mapTypedRow({ ...item, type: 'post' })
      return mapped ? [mapped] : []
    }),
    ...notes.flatMap((item) => {
      const mapped = mapTypedRow({ ...item, type: 'note' })
      return mapped ? [mapped] : []
    }),
  ]
}
