'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  applyPublicPostSnapshot,
  refreshPublicContent,
} from '~/lib/public-content-refresh'
import { loadPublishedPosts } from '~/lib/public-posts'
import { publicContentQueryOptions } from '~/lib/publication'

import { queryClient } from './react-query-provider'

export const PublicContentSync = () => {
  const router = useRouter()
  const previous = useRef<string>()
  const { data } = useQuery({
    ...publicContentQueryOptions,
    queryKey: ['public-post-index'],
    queryFn: loadPublishedPosts,
    // Updates are normally pushed by the gateway. Reconcile missed room-only
    // events without fetching every category or refreshing the page on a timer.
    refetchInterval: 15_000,
  })
  const revision =
    data &&
    JSON.stringify(
      data
        .map((post) => [
          post.id,
          post.modified,
          post.title,
          post.slug,
          post.category?.slug,
        ])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    )

  useEffect(() => {
    if (!revision) return
    const changed = previous.current != null && previous.current !== revision
    previous.current = revision
    if (changed && data) {
      applyPublicPostSnapshot(queryClient, data)
      void refreshPublicContent(queryClient)
      router.refresh()
    }
  }, [revision, data, router])
  return null
}
