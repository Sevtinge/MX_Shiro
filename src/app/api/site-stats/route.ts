import { NextResponse } from 'next/server'
import removeMarkdown from 'remove-markdown'

import { apiClient } from '~/lib/request'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50
const countCharacters = (text: string) =>
  Array.from(removeMarkdown(text).replaceAll(/\s/g, '')).length

type Publication = { text: string }
type PublicationCounts = { count: number; characters: number }

async function countPublications(
  getPage: (page: number) => PromiseLike<{
    data: Publication[]
    pagination: { hasNextPage: boolean }
  }>,
): Promise<PublicationCounts> {
  let count = 0
  let characters = 0
  let page = 1

  while (true) {
    const result = await getPage(page)
    for (const item of result.data) {
      if (typeof item.text !== 'string') {
        throw new TypeError('Publication list did not include full text')
      }
      count += 1
      characters += countCharacters(item.text)
    }
    if (!result.pagination.hasNextPage) return { count, characters }
    if (result.data.length === 0 || page >= 1000) {
      throw new Error('Publication pagination did not finish')
    }
    page += 1
  }
}

type Stats = {
  posts: number | null
  notes: number | null
  thoughts: number | null
  characters: number | null
  approximateCharacters: boolean
}

const getSiteStats = async (): Promise<Stats> => {
  const [statResult, postResult, noteResult, thoughtResult, wordResult] =
    await Promise.allSettled([
      apiClient.aggregate.getStat(),
      countPublications((page) => apiClient.post.getList(page, PAGE_SIZE)),
      countPublications((page) => apiClient.note.getList(page, PAGE_SIZE)),
      apiClient.shorthand.getAll(),
      apiClient.proxy.aggregate.count_site_words.get<{
        data: { length: number }
      }>(),
    ])

  const stat = statResult.status === 'fulfilled' ? statResult.value : null
  const posts = postResult.status === 'fulfilled' ? postResult.value : null
  const notes = noteResult.status === 'fulfilled' ? noteResult.value : null
  const thoughts =
    thoughtResult.status === 'fulfilled' &&
    Array.isArray(thoughtResult.value.data)
      ? thoughtResult.value.data
      : null

  // An empty content type does not require a successful list request to
  // contribute zero characters to the total.
  const postCharacters = posts?.characters ?? (stat?.posts === 0 ? 0 : null)
  const noteCharacters = notes?.characters ?? (stat?.notes === 0 ? 0 : null)
  const thoughtCharacters = thoughts
    ? thoughts.reduce(
        (sum, thought) => sum + countCharacters(thought.content),
        0,
      )
    : stat?.recently === 0
      ? 0
      : null
  const exactCharacters =
    postCharacters !== null &&
    noteCharacters !== null &&
    thoughtCharacters !== null
      ? postCharacters + noteCharacters + thoughtCharacters
      : null
  const fallbackCharacters =
    wordResult.status === 'fulfilled' ? wordResult.value.data?.length : null

  if (!stat && !posts && !notes && !thoughts && fallbackCharacters == null) {
    throw new Error('All site statistics sources are unavailable')
  }

  if (exactCharacters === null) {
    console.warn('[site-stats] Exact word count unavailable', {
      posts: postResult.status,
      notes: noteResult.status,
      thoughts: thoughtResult.status,
      fallback: wordResult.status,
    })
  }

  return {
    posts: stat?.posts ?? posts?.count ?? null,
    notes: stat?.notes ?? notes?.count ?? null,
    thoughts: stat?.recently ?? thoughts?.length ?? null,
    characters: exactCharacters ?? fallbackCharacters ?? null,
    approximateCharacters: exactCharacters === null,
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
