const published = new Set(['true', '1', 'published', 'publish', '已发布'])
const normalize = (value: unknown) => String(value).trim().toLowerCase()

export const isPublished = (item: object) => {
  const entry = item as Record<string, unknown>
  if (entry.hide != null && ['true', '1'].includes(normalize(entry.hide)))
    return false
  // An explicit unpublished state always wins, including conflicting flags.
  for (const key of ['isPublished', 'is_published', 'status']) {
    const value = entry[key]
    if (value != null && value !== '' && !published.has(normalize(value))) {
      return false
    }
  }
  // Some public projections omit the flag. Check these against the public
  // post index before displaying them, rather than treating them as published.
  return true
}

export const filterPublishedPosts = <T extends { id?: string }>(
  items: readonly T[],
  publishedIds: ReadonlySet<string>,
) =>
  items.filter(
    (item) => !!item.id && publishedIds.has(item.id) && isPublished(item),
  )

export const isVerificationFailure = (error: unknown) => {
  const entry = error as {
    status?: number
    name?: string
    raw?: { name?: string; response?: { status?: number } }
    response?: { status?: number }
  }
  return (
    entry?.status === 468 ||
    entry?.response?.status === 468 ||
    entry?.raw?.response?.status === 468 ||
    entry?.name === 'SafeLineVerificationCancelled' ||
    entry?.raw?.name === 'SafeLineVerificationCancelled'
  )
}

export const publicContentQueryOptions = {
  retry: (failureCount: number, error: unknown) =>
    !isVerificationFailure(error) && failureCount < 1,
  staleTime: 0,
  refetchOnWindowFocus: 'always' as const,
  refetchOnReconnect: 'always' as const,
  meta: { persist: false },
}

export const publicContentQueryRoots = new Set([
  'public-post-index',
  'home',
  'home-activity-recent',
  'post',
  'category',
  'timeline',
  'search',
  'tags',
  'tag',
  'rooms',
  'header-categories',
  'header-category-posts',
  'header-note-menu',
  'header-timeline-menu',
])

export const isPublicContentQuery = (key: readonly unknown[]) =>
  publicContentQueryRoots.has(String(key[0])) || key[1] === 'tag'

// Remove withdrawn entries immediately, while fresh queries and RSC renders
// are still in flight. This also covers old persisted preview projections.
export const pruneCachedPublicPosts = <T>(
  value: T,
  ids: ReadonlySet<string>,
  paths: ReadonlySet<string>,
  postCollection = false,
): T => {
  const normalizePath = (value: string) => {
    const path = value.split(/[?#]/, 1)[0].replace(/\/$/, '')
    try {
      return decodeURI(path)
    } catch {
      return path
    }
  }
  const publicPaths = new Set([...paths].map(normalizePath))
  const visit = (data: unknown, postContext = false): unknown => {
    if (Array.isArray(data))
      return data
        .map((entry) => visit(entry, postContext))
        .filter((entry) => entry !== null)
    if (!data || typeof data !== 'object') return data
    const entry = data as Record<string, unknown>
    const path = entry.href ?? entry.path ?? entry.url
    if (
      typeof path === 'string' &&
      path.startsWith('/posts/') &&
      !publicPaths.has(normalizePath(path))
    )
      return null
    if (typeof entry.id === 'string') {
      if (entry.id.startsWith('post-') && !ids.has(entry.id.slice(5)))
        return null
      const isPost =
        entry.nid == null &&
        (entry.type === 'posts' ||
          entry.type === 'post' ||
          ((postContext ||
            entry.category != null ||
            entry.categoryId != null) &&
            typeof entry.title === 'string' &&
            (entry.type == null ||
              entry.type === 'posts' ||
              entry.type === 'post')))
      if (isPost && (!ids.has(entry.id) || !isPublished(entry))) return null
    }
    return Object.fromEntries(
      Object.entries(entry).map(([key, child]) => [
        key,
        visit(child, ['posts', 'post', 'children', 'related'].includes(key)),
      ]),
    )
  }
  return visit(value, postCollection) as T
}
