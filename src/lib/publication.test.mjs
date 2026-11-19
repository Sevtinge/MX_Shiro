import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  filterPublishedPosts,
  isPublicContentQuery,
  isPublished,
  pruneCachedPublicPosts,
} from './publication.ts'

test('every explicit non-published state is excluded, including conflicting flags', () => {
  for (const status of [
    'draft',
    'private',
    'scheduled',
    'archived',
    'unpublished',
    '草稿',
    '未发布',
    0,
    'unknown',
  ]) {
    assert.equal(isPublished({ status }), false, String(status))
    assert.equal(isPublished({ isPublished: true, status }), false)
  }
  for (const flags of [
    { isPublished: false },
    { is_published: 0 },
    { isPublished: 'false' },
    { isPublished: true, is_published: false },
    { hide: 'true' },
  ]) {
    assert.equal(isPublished(flags), false)
  }
  assert.equal(isPublished({ isPublished: true, status: '已发布' }), true)
})

test('status-less category projections are intersected with the public list', () => {
  const rows = [
    { id: 'live' },
    { id: 'withdrawn' },
    { id: 'explicit-draft', isPublished: false },
    { title: 'missing-id' },
  ]
  assert.deepEqual(
    filterPublishedPosts(rows, new Set(['live', 'explicit-draft'])),
    [{ id: 'live' }],
  )
})

test('refresh includes all public entry points and excludes admin queries', () => {
  for (const key of [
    'post',
    'category',
    'home',
    'timeline',
    'search',
    'header-category-posts',
    'header-timeline-menu',
    'header-note-menu',
    'tags',
    'rooms',
  ])
    assert.equal(isPublicContentQuery([key]), true, key)
  assert.equal(isPublicContentQuery(['网络', 'tag']), true)
  assert.equal(isPublicContentQuery(['postAdmin', 'paginate']), false)
})

test('revoked entries disappear from nested categories, previews and search', () => {
  const live = { id: 'live', title: 'Live', slug: 'live' }
  const withdrawn = { id: 'withdrawn', title: 'Draft', slug: 'draft' }
  const ids = new Set(['live'])
  const paths = new Set(['/posts/test/live'])
  const cached = {
    children: [live, withdrawn],
    timeline: { posts: [live, withdrawn] },
    links: [{ href: '/posts/test/live' }, { href: '/posts/test/draft' }],
    search: [{ id: 'post-live' }, { id: 'post-withdrawn' }],
  }
  assert.deepEqual(pruneCachedPublicPosts(cached, ids, paths), {
    children: [live],
    timeline: { posts: [live] },
    links: [{ href: '/posts/test/live' }],
    search: [{ id: 'post-live' }],
  })
  assert.deepEqual(
    cached.children,
    [live, withdrawn],
    'does not mutate old data',
  )
  assert.deepEqual(
    pruneCachedPublicPosts([live, withdrawn], ids, paths, true),
    [live],
  )
})

test('cache pruning preserves notes, independent pages and plain metadata', () => {
  const cached = {
    notes: [{ id: 'note', title: 'Note', slug: 'note', nid: 1 }],
    pages: [{ id: 'page', title: 'About', slug: 'about' }],
    category: { id: 'category', name: 'Category', slug: 'test' },
    pagination: { total: 3, hasNextPage: false },
    path: '/notes/1',
  }
  assert.deepEqual(pruneCachedPublicPosts(cached, new Set(), new Set()), cached)
})

test('cache pruning keeps published Chinese paths with URL encoding and anchors', () => {
  const rows = [
    { href: '/posts/随记/已发布' },
    { href: '/posts/%E9%9A%8F%E8%AE%B0/%E5%B7%B2%E5%8F%91%E5%B8%83#comments' },
    { href: '/posts/随记/草稿' },
  ]
  assert.deepEqual(
    pruneCachedPublicPosts(rows, new Set(), new Set(['/posts/随记/已发布'])),
    rows.slice(0, 2),
  )
})
