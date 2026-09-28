import assert from 'node:assert/strict'
import { test } from 'node:test'

import { QueryClient } from '@tanstack/react-query'

import {
  filterDeletedComments,
  hideDeletedComment,
  isDeletedComment,
  markCommentDeleted,
} from './comment-visibility.ts'

const comment = (id, options = {}) => ({
  id,
  text: `Comment ${id}`,
  ...options,
})
const page = (data, options = {}) => ({
  data,
  pagination: { currentPage: 1, hasNextPage: false, ...options },
})

test('filters soft-deleted comments by flag, not by placeholder text', () => {
  const comments = [
    comment('deleted', { isDeleted: true, text: '该评论已删除' }),
    comment('deleted-with-original-text', { isDeleted: true }),
    comment('live', { isDeleted: false }),
    comment('legacy'),
    comment('normal-placeholder-quote', { text: '该评论已删除' }),
  ]

  assert.deepEqual(
    filterDeletedComments(comments).map((item) => item.id),
    ['live', 'legacy', 'normal-placeholder-quote'],
  )
})

test('removes deleted leaf replies without removing their live parent', () => {
  const comments = [
    comment('root', {
      children: [
        comment('deleted-reply', { isDeleted: true }),
        comment('live-reply'),
      ],
    }),
  ]

  const visible = filterDeletedComments(comments)
  assert.equal(visible[0].id, 'root')
  assert.deepEqual(
    visible[0].children.map((item) => item.id),
    ['live-reply'],
  )
})

test('promotes live replies when their root comment is deleted', () => {
  const comments = [
    comment('before'),
    comment('deleted-root', {
      isDeleted: true,
      children: [comment('first-reply'), comment('second-reply')],
    }),
    comment('after'),
  ]

  assert.deepEqual(
    filterDeletedComments(comments).map((item) => item.id),
    ['before', 'first-reply', 'second-reply', 'after'],
  )
})

test('keeps live descendants through multiple deleted ancestors', () => {
  const comments = [
    comment('root', {
      children: [
        comment('deleted-reply', {
          isDeleted: true,
          children: [
            comment('deleted-grandchild', {
              isDeleted: true,
              children: [comment('live-descendant')],
            }),
          ],
        }),
      ],
    }),
  ]

  const visible = filterDeletedComments(comments)
  assert.deepEqual(
    visible[0].children.map((item) => item.id),
    ['live-descendant'],
  )
})

test('deleted-only lists and empty lists have no visible comments', () => {
  assert.deepEqual(filterDeletedComments([]), [])
  assert.deepEqual(
    filterDeletedComments([comment('deleted', { isDeleted: true })]),
    [],
  )
})

test('does not mutate the raw tree needed to insert new replies', () => {
  const reply = Object.freeze(comment('reply'))
  const root = Object.freeze(
    comment('deleted-root', {
      isDeleted: true,
      children: Object.freeze([reply]),
    }),
  )
  const comments = Object.freeze([root])

  assert.deepEqual(filterDeletedComments(comments), [reply])
  assert.equal(comments[0], root)
  assert.equal(comments[0].children[0], reply)
})

test('marks a nested comment deleted without discarding its live children', () => {
  const comments = [
    comment('root', {
      children: [comment('target', { children: [comment('live-child')] })],
    }),
  ]

  const marked = markCommentDeleted(comments, 'target')
  assert.equal(marked[0].children[0].isDeleted, true)
  assert.equal(comments[0].children[0].isDeleted, undefined)
  assert.deepEqual(
    filterDeletedComments(marked)[0].children.map((item) => item.id),
    ['live-child'],
  )
})

test('flat admin lists can hide deleted rows without promoting or duplicating replies', () => {
  const reply = comment('reply')
  const comments = [
    comment('root', { isDeleted: true, children: [reply] }),
    reply,
  ]

  assert.deepEqual(
    comments.filter((item) => !isDeletedComment(item)),
    [reply],
  )
})

test('a deleted-only first page does not hide comments loaded on later pages', () => {
  const pages = [
    page([comment('deleted', { isDeleted: true })], { hasNextPage: true }),
    page([comment('live')], { currentPage: 2 }),
  ]
  const visiblePages = pages.map((item) => filterDeletedComments(item.data))

  assert.equal(
    visiblePages.some((items) => items.length > 0),
    true,
  )
  assert.equal(pages[0].pagination.hasNextPage, true)
  assert.equal(visiblePages[1][0].id, 'live')
})

test('delete events update cached threads and invalidate public and admin queries', () => {
  const client = new QueryClient()
  const publicKey = ['comments', 'article-one']
  const otherKey = ['comments', 'article-two']
  const unrelatedKey = ['posts', 'article-one']
  const cached = {
    pages: [page([comment('target', { children: [comment('live-child')] })])],
    pageParams: [1],
  }
  const other = { pages: [page([comment('other')])], pageParams: [1] }
  const unrelated = { id: 'post' }
  client.setQueryData(publicKey, cached)
  client.setQueryData(otherKey, other)
  client.setQueryData(unrelatedKey, unrelated)
  const invalidated = []
  client.invalidateQueries = (options) => {
    invalidated.push(options.queryKey)
    return Promise.resolve()
  }

  hideDeletedComment(client, 'target')

  const updated = client.getQueryData(publicKey)
  assert.equal(updated.pages[0].data[0].isDeleted, true)
  assert.equal(cached.pages[0].data[0].isDeleted, undefined)
  assert.deepEqual(updated.pageParams, [1])
  assert.deepEqual(updated.pages[0].pagination, cached.pages[0].pagination)
  assert.deepEqual(
    filterDeletedComments(updated.pages[0].data).map((item) => item.id),
    ['live-child'],
  )
  assert.deepEqual(client.getQueryData(otherKey), other)
  assert.equal(client.getQueryData(unrelatedKey), unrelated)
  assert.deepEqual(invalidated, [['comments'], ['comment', 'admin']])
  client.clear()
})

test('delete events do not create nonexistent comment caches', () => {
  const client = new QueryClient()
  hideDeletedComment(client, 'unknown')
  assert.deepEqual(client.getQueriesData({ queryKey: ['comments'] }), [])
  client.clear()
})

test('preserves Core v11 replies when their deleted root is hidden', () => {
  const comments = [
    comment('deleted-root', {
      isDeleted: true,
      replies: [
        comment('live-reply'),
        comment('deleted-reply', { isDeleted: true }),
      ],
    }),
  ]

  assert.deepEqual(
    filterDeletedComments(comments).map((item) => item.id),
    ['live-reply'],
  )
})

test('merges server replies and optimistic children without duplicates', () => {
  const comments = [
    comment('root', {
      replies: [comment('existing'), comment('deleted', { isDeleted: true })],
      children: [comment('existing', { text: 'updated' }), comment('new')],
    }),
  ]

  const visible = filterDeletedComments(comments)
  assert.deepEqual(
    visible[0].children.map((item) => item.id),
    ['existing', 'new'],
  )
  assert.equal(visible[0].children[0].text, 'updated')
})

test('delete events also mark replies in the Core v11 response shape', () => {
  const comments = [
    comment('root', {
      replies: [comment('target'), comment('live')],
    }),
  ]

  const marked = markCommentDeleted(comments, 'target')
  assert.equal(marked[0].replies[0].isDeleted, true)
  assert.deepEqual(
    filterDeletedComments(marked)[0].children.map((item) => item.id),
    ['live'],
  )
  assert.equal(comments[0].replies[0].isDeleted, undefined)
})
