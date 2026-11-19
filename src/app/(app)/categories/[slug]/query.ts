import { getPublicCategory } from '~/lib/public-posts'
import { publicContentQueryOptions } from '~/lib/publication'
import { defineQuery } from '~/queries/helper'

export const getPageBySlugQuery = (slug: string) =>
  defineQuery({
    ...publicContentQueryOptions,
    queryKey: ['category', slug],
    queryFn: async ({ queryKey }) => {
      const [, slug] = queryKey

      const data = await getPublicCategory(slug)

      return {
        ...data,
      }
    },
  })
