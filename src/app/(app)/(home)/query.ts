import { useQuery } from '@tanstack/react-query'

import { getPublicTop } from '~/lib/public-posts'
import { publicContentQueryOptions } from '~/lib/publication'

export const queryKey = ['home']

export const useHomeQueryData = () => {
  return useQuery({
    ...publicContentQueryOptions,
    queryKey,
    queryFn: () => getPublicTop(5),
    // The gateway only broadcasts edits to readers in that article room.
    // Reconcile the homepage when nobody here is subscribed to that room.
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
  }).data!
}
