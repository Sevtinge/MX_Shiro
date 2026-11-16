import { apiClient } from '~/lib/request'

import { isPublishedPreviewItem } from './published-preview'

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
  isPublished?: boolean | null
  status?: string | number | null
}

type TopPost = {
  id: string
  title: string
  slug: string
  created: string
  category?: { slug?: string }
  isPublished?: boolean | null
  status?: string | number | null
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
  // Ask for more than the visible rows so drafts can be dropped without
  // leaving the published list short.
  const { notes, posts } = (await apiClient.aggregate.getTop(30)).$serialized
  const listedNotes: TopNote[] = notes.filter(isPublishedPreviewItem)
  const listedPosts: TopPost[] = posts.filter(isPublishedPreviewItem)
  return {
    note: listedNotes.map(noteItem),
    post: listedPosts.map(postItem),
    memory: listedNotes.filter((note) => note.bookmark).map(noteItem),
  }
}
