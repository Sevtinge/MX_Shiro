import type { MetadataRoute } from 'next'

import { fetchAggregationData } from './(app)/api'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { seo, theme } = await fetchAggregationData()
  const { favicon } = theme.config.site

  return {
    name: seo.title,
    short_name: seo.title,
    description: seo.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    icons: [{ src: favicon, sizes: 'any' }],
  }
}
