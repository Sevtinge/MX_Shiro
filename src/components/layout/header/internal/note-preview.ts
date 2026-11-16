import { apiClient } from '~/lib/request'

import type { PreviewEntry } from './PreviewMenuShell'
import { isPublishedPreviewItem } from './published-preview'

export type NoteMenuTopic = {
  name: string
  slug: string
}

type ListedNote = {
  id: string
  nid?: number
  title: string
  created: string
  isPublished?: boolean | null
  status?: string | number | null
  topic?: { slug?: string; name?: string } | null
}

export type NoteMenuData = {
  topics: NoteMenuTopic[]
  items: Record<string, PreviewEntry[]>
}

const toEntry = (note: ListedNote): PreviewEntry => ({
  id: note.id,
  title: note.title,
  href: `/notes/${note.nid || note.id}`,
  created: note.created,
})

export function groupNotes(
  topics: NoteMenuTopic[],
  notes: ListedNote[],
): NoteMenuData {
  const items: Record<string, PreviewEntry[]> = {}
  const published = notes.filter(isPublishedPreviewItem)
  for (const topic of topics) {
    items[topic.slug] = published
      .filter((note) => note.topic?.slug === topic.slug)
      .map(toEntry)
  }
  return { topics, items }
}

export async function loadNoteMenu(): Promise<NoteMenuData> {
  const [topicResult, noteResult] = await Promise.all([
    apiClient.topic.getAll().catch(() => ({ data: [] as NoteMenuTopic[] })),
    apiClient.note.getList(1, 40),
  ])
  return groupNotes(topicResult.data ?? [], noteResult.data ?? [])
}
