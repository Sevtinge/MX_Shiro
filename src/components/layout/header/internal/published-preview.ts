/** Logged-in API responses include drafts. Nav previews only list published work. */
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
  status?: string | number | null
}

export const isPublishedPreviewItem = (item: object) => {
  const entry = item as PreviewPublishState
  if (isExplicitDraft(entry.isPublished)) return false
  if (isExplicitPublished(entry.isPublished)) return true
  if (entry.status == null || entry.status === '') return true
  return !isExplicitDraft(entry.status)
}
