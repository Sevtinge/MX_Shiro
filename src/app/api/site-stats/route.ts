import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import removeMarkdown from 'remove-markdown'

import { apiClient } from '~/lib/request'

const PAGE_SIZE = 50

type Publication = { text: string }

async function getAllPublications(
  getPage: (page: number) => PromiseLike<{
    data: Publication[]
    pagination: { hasNextPage: boolean }
  }>,
): Promise<Publication[]> {
  const publications: Publication[] = []
  let page = 1

  while (true) {
    const result = await getPage(page)
    publications.push(...result.data)
    if (!result.pagination.hasNextPage) break
    page += 1
  }

  return publications
}

const countCharacters = (text: string) =>
  Array.from(removeMarkdown(text).replaceAll(/\s/g, '')).length

const getSiteStats = unstable_cache(
  async () => {
    const [posts, notes, thoughts] = await Promise.all([
      getAllPublications((page) => apiClient.post.getList(page, PAGE_SIZE)),
      getAllPublications((page) => apiClient.note.getList(page, PAGE_SIZE)),
      apiClient.shorthand.getAll(),
    ])
    const publicThoughts = thoughts.data

    return {
      posts: posts.length,
      notes: notes.length,
      thoughts: publicThoughts.length,
      characters:
        posts.reduce((sum, post) => sum + countCharacters(post.text), 0) +
        notes.reduce((sum, note) => sum + countCharacters(note.text), 0) +
        publicThoughts.reduce(
          (sum, thought) => sum + countCharacters(thought.content),
          0,
        ),
    }
  },
  ['public-site-stats'],
  { revalidate: 3600, tags: ['public-site-stats'] },
)

export async function GET() {
  try {
    return NextResponse.json(await getSiteStats())
  } catch {
    return NextResponse.json({ error: '统计暂不可用' }, { status: 503 })
  }
}
