import type { AggregateRoot } from '@mx-space/api-client'
import { simpleCamelcaseKeys } from '@mx-space/api-client'
import { $fetch } from 'ofetch'
import { cache } from 'react'

import { appStaticConfig } from '~/app.static.config'
import { attachServerFetch } from '~/lib/attach-fetch'
import {
  devAggregateFallback,
  isAggregateOfflineError,
} from '~/lib/dev-aggregate-fallback'
import { isDev } from '~/lib/env'
import { getQueryClient } from '~/lib/query-client.server'
import { apiClient } from '~/lib/request'

const cacheTime = appStaticConfig.cache.enabled
  ? appStaticConfig.cache.ttl.aggregation
  : 1
export const fetchAggregationData = cache(async () => {
  attachServerFetch()
  const queryClient = getQueryClient()
  const fetcher = async () => {
    try {
      return (await $fetch<
        AggregateRoot & {
          theme: AppThemeConfig
        }
      >(apiClient.aggregate.proxy.toString(true), {
        params: {
          theme: 'shiro',
        },
        next: {
          revalidate: cacheTime,
          tags: ['aggregate', 'shiro'],
        },
      }).then(simpleCamelcaseKeys)) as AggregateRoot & {
        theme: AppThemeConfig
      }
    } catch (error) {
      if (isDev && isAggregateOfflineError(error)) return devAggregateFallback
      throw error
    }
  }

  return queryClient.fetchQuery({
    queryKey: ['aggregate', 'shiro'],
    queryFn: fetcher,
    staleTime: cacheTime,
    gcTime: cacheTime,
  })
})
