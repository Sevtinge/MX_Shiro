import { NextResponse } from 'next/server'

import { apiClient } from '~/lib/request'

export const dynamic = 'force-dynamic'

const countCharacters = (text: string) => Array.from(text).length

type Stats = {
  posts: number | null
  notes: number | null
  thoughts: number | null
  characters: number | null
  approximateCharacters: boolean
}

const getSiteStats = async (): Promise<Stats> => {
  // Use the backend's aggregate counters so this does not load every article
  // on each visit. Independent fallbacks keep the UI populated if one fails.
  const [
    statResult,
    wordResult,
    postResult,
    noteResult,
    thoughtResult,
    pageResult,
  ] = await Promise.allSettled([
    apiClient.aggregate.getStat(),
    apiClient.proxy.aggregate.count_site_words.get<{
      data: { length: number }
    }>(),
    apiClient.post.getList(1, 1),
    apiClient.note.getList(1, 1),
    apiClient.shorthand.getAll(),
    apiClient.page.getList(1, 100),
  ])

  const stat = statResult.status === 'fulfilled' ? statResult.value : null
  const postPage = postResult.status === 'fulfilled' ? postResult.value : null
  const notePage = noteResult.status === 'fulfilled' ? noteResult.value : null
  const thoughts =
    thoughtResult.status === 'fulfilled' &&
    Array.isArray(thoughtResult.value.data)
      ? thoughtResult.value.data
      : null
  const pages = pageResult.status === 'fulfilled' ? pageResult.value : null
  const siteCharacters =
    wordResult.status === 'fulfilled' ? wordResult.value.data?.length : null

  // count_site_words includes pages but excludes thoughts. Adjust it when
  // both supplementary public lists are available; otherwise label it approximate.
  const adjustedCharacters =
    siteCharacters != null && pages && !pages.pagination.hasNextPage && thoughts
      ? Math.max(
          0,
          siteCharacters -
            pages.data.reduce(
              (sum, page) => sum + countCharacters(page.text),
              0,
            ) +
            thoughts.reduce(
              (sum, thought) => sum + countCharacters(thought.content),
              0,
            ),
        )
      : null

  if (!stat && !postPage && !notePage && !thoughts && siteCharacters == null) {
    throw new Error('All site statistics sources are unavailable')
  }

  return {
    posts: stat?.posts ?? postPage?.pagination.total ?? null,
    notes: stat?.notes ?? notePage?.pagination.total ?? null,
    thoughts: stat?.recently ?? thoughts?.length ?? null,
    characters: adjustedCharacters ?? siteCharacters ?? null,
    approximateCharacters: adjustedCharacters === null,
  }
}

export async function GET() {
  try {
    return NextResponse.json(await getSiteStats(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[site-stats] Failed to load statistics:', error)
    return NextResponse.json(
      {
        posts: null,
        notes: null,
        thoughts: null,
        characters: null,
        approximateCharacters: true,
      } satisfies Stats,
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
