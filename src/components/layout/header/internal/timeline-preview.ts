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
  const top = await apiClient.aggregate.getTop(8)
  const notes: TopNote[] = top.notes ?? top.data?.notes ?? []
  const posts: TopPost[] = top.posts ?? top.data?.posts ?? []
  return {
    note: notes.map(noteItem),
    post: posts.map(postItem),
    memory: notes.filter((note) => note.bookmark).map(noteItem),
  }
}
