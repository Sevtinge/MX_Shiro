export {
  filterPublishedPosts as filterToPublishedIds,
  isPublished as isPublishedPreviewItem,
} from '../../../../lib/publication'

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
    if (query.isError)
      return [{ ...category, visibleCount: null as number | null }]
    const visibleCount = query.data?.length ?? 0
    if (visibleCount === 0) return []
    return [{ ...category, visibleCount }]
  })
