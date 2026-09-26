import { useQuery } from '@tanstack/react-query'

import { apiClient } from '~/lib/request'

export const queryKey = ['home']

export const useHomeQueryData = () => {
  return useQuery({
    queryKey,
    queryFn: async () => (await apiClient.aggregate.getTop(5)).$serialized,
  }).data!
}
