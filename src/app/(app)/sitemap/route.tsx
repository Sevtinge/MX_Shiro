import { filterPublicPostLinks } from '~/lib/public-posts'
import { getQueryClient } from '~/lib/query-client.server'
import { $publicFetch, publicApiClient as apiClient } from '~/lib/request'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const GET = async () => {
  const queryClient = getQueryClient()

  const { data } = await queryClient.fetchQuery({
    queryKey: ['sitemap'],
    queryFn: async () => {
      const path = apiClient.aggregate.proxy.sitemap.toString(true)
      const result = await $publicFetch<{ data: Array<{ url: string }> }>(path)
      return { ...result, data: await filterPublicPostLinks(result.data) }
    },
  })

  const xml = `
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${data
    .map(
      (item: any) => `<url>
  <loc>${item.url}</loc>
${!!item.published_at && `<lastmod>${item.published_at || 'N/A'}</lastmod>`}
  <changefreq>daily</changefreq>
  </url>`,
    )

    .join('')}
  </urlset>
  `.trim()
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store',
    },
  })
}
