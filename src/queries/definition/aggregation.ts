import type { AggregateRoot } from '@mx-space/api-client'
import { isServer } from '@tanstack/react-query'

import {
  devAggregateFallback,
  isAggregateOfflineError,
} from '~/lib/dev-aggregate-fallback'
import { isDev } from '~/lib/env'
import { apiClient } from '~/lib/request'

import { defineQuery } from '../helper'

export const aggregation = {
  root: () =>
    defineQuery({
      queryKey: ['aggregation'],
      queryFn: async () => {
        try {
          const res = await apiClient.aggregate.getAggregateData('shiro')
          return res.$serialized as AggregateRoot & {
            theme: AppThemeConfig
          }
        } catch (error) {
          if (isDev && isAggregateOfflineError(error))
            return devAggregateFallback
          throw error
        }
      },
      gcTime: 1000 * 60 * 10,
      staleTime: isServer ? 1000 * 60 * 10 : undefined,
    }),
}
