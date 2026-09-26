import { useQuery } from '@tanstack/react-query'

import { apiClient } from '~/lib/request'

export const queryKey = ['home']

export const useHomeQueryData = () => {
  return useQuery({
    queryKey,
    queryFn: async () => (await apiClient.aggregate.getTop(5)).$serialized,
    // The gateway only broadcasts edits to readers in that article room.
    // Reconcile the homepage when nobody here is subscribed to that room.
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
  }).data!
}
