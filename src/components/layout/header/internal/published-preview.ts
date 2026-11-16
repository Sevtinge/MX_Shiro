/** Logged-in API responses include drafts. Nav previews only list published work. */
const draftStatuses = new Set(['false', '0', 'draft', 'unpublished', '草稿'])
const publishedStatuses = new Set(['true', '1', 'published', 'publish', '已发布'])

const normalized = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const isExplicitDraft = (value: unknown) =>
  value === false || value === 0 || draftStatuses.has(normalized(value))

const isExplicitPublished = (value: unknown) =>
  value === true || value === 1 || publishedStatuses.has(normalized(value))

export const isPublishedPreviewItem = (item: {
  isPublished?: boolean | number | string | null
  status?: string | number | null
}) => {
  if (isExplicitDraft(item.isPublished)) return false
  if (isExplicitPublished(item.isPublished)) return true
  if (item.status == null || item.status === '') return true
  return !isExplicitDraft(item.status)
}
