import 'server-only'

import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 3,
          gcTime: 1000 * 30,
        },
      },
    }),
)
