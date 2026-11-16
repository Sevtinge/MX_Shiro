/** Logged-in and category payloads can include drafts. Nav previews only list published work. */
const draftStatuses = new Set(['false', '0', 'draft', 'unpublished', '草稿'])
const publishedStatuses = new Set(['true', '1', 'published', 'publish', '已发布'])

const normalized = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const isExplicitDraft = (value: unknown) =>
  value === false || value === 0 || draftStatuses.has(normalized(value))

const isExplicitPublished = (value: unknown) =>
  value === true || value === 1 || publishedStatuses.has(normalized(value))

type PreviewPublishState = {
  isPublished?: boolean | number | string | null
  is_published?: boolean | number | string | null
  hide?: boolean | number | string | null
  status?: string | number | null
}

const publishFlag = (entry: PreviewPublishState) =>
  entry.isPublished !== undefined ? entry.isPublished : entry.is_published

export const isPublishedPreviewItem = (item: object) => {
  const entry = item as PreviewPublishState
  const flag = publishFlag(entry)
  if (isExplicitDraft(flag) || entry.hide === true || entry.hide === 1) return false
  if (isExplicitPublished(flag)) return true
  if (entry.status == null || entry.status === '') return true
  return !isExplicitDraft(entry.status)
}

export const filterToPublishedIds = <T extends { id?: string }>(
  items: T[],
  publishedIds: ReadonlySet<string>,
) =>
  items.filter(
    (item) =>
      !!item.id && publishedIds.has(item.id) && isPublishedPreviewItem(item),
  )

export const selectVisibleCategories = <T extends { slug: string }>(
  categories: T[],
  results: Array<{
    isLoading?: boolean
    isError?: boolean
    data?: { length: number } | null
  }>,
) =>
  categories.flatMap((category, index) => {
    const query = results[index]
    if (!query || query.isLoading) return []
    if (query.isError) return [{ ...category, visibleCount: null as number | null }]
    const visibleCount = query.data?.length ?? 0
    if (visibleCount === 0) return []
    return [{ ...category, visibleCount }]
  })
