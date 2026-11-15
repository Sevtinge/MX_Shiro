import { apiClient } from '~/lib/request'

export type TimelineMenuItem = {
  id: string
  title: string
  href: string
  created: string
  meta: string
}

type TopNote = {
  id: string
  nid?: number
  title: string
  created: string
  bookmark?: boolean
}

type TopPost = {
  id: string
  title: string
  slug: string
  created: string
  category?: { slug?: string }
}

export type TimelineMenuData = {
  note: TimelineMenuItem[]
  post: TimelineMenuItem[]
  memory: TimelineMenuItem[]
}

const noteItem = (note: TopNote): TimelineMenuItem => ({
  id: `note-${note.id}`,
  title: note.title,
  href: `/notes/${note.nid || note.id}`,
  created: note.created,
  meta: '手记',
})

const postItem = (post: TopPost): TimelineMenuItem => ({
  id: `post-${post.id}`,
  title: post.title,
  href: `/posts/${post.category?.slug || 'post'}/${post.slug}`,
  created: post.created,
  meta: '文稿',
})

export async function loadTimelineMenu(): Promise<TimelineMenuData> {
  const { notes, posts } = (await apiClient.aggregate.getTop(8)).$serialized
  const listedNotes: TopNote[] = notes
  const listedPosts: TopPost[] = posts
  return {
    note: listedNotes.map(noteItem),
    post: listedPosts.map(postItem),
    memory: listedNotes.filter((note) => note.bookmark).map(noteItem),
  }
}
