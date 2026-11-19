import { cache } from 'react'

import { attachServerFetch } from '~/lib/attach-fetch'
import { getPublicCategory } from '~/lib/public-posts'
import { requestErrorHandler } from '~/lib/request.server'

export const getData = cache(async (params: { slug: string }) => {
  attachServerFetch()
  return await getPublicCategory(params.slug).catch(requestErrorHandler)
})
