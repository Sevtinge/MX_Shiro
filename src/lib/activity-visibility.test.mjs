import assert from 'node:assert/strict'
import { test } from 'node:test'

import { QueryClient } from '@tanstack/react-query'

import {
  filterDeletedCommentActivities,
  isDeletedCommentActivity,
} from './activity-visibility.ts'
import { hideDeletedComment } from './comment-visibility.ts'

const comment = (id, text, options = {}) => ({ id, text, ...options })

test('hides the deployed activity API placeholder when the deletion flag is omitted', () => {
  assert.equal(
    isDeletedCommentActivity(comment('article', '该评论已删除')),
    true,
  )
  assert.equal(
    isDeletedCommentActivity(comment('article', '  该评论已删除\n')),
    true,
  )
})

test('uses an explicit deletion flag before checking the placeholder text', () => {
  assert.equal(
    isDeletedCommentActivity(
      comment('article', 'original text', { isDeleted: true }),
    ),
    true,
  )
  assert.equal(
    isDeletedCommentActivity(
      comment('article', '该评论已删除', { isDeleted: false }),
    ),
    false,
  )
})

test('does not hide normal comments that mention or quote the deletion placeholder', () => {
  for (const text of [
    'Normal comment',
    '为什么会显示该评论已删除？',
    '> 该评论已删除',
    '“该评论已删除”',
  ]) {
    assert.equal(isDeletedCommentActivity(comment('article', text)), false)
  }
})

test('filters only the comment group and preserves other activities and ordering', () => {
  const live = comment('same-article', 'live comment')
  const explicitLive = comment('another-article', '该评论已删除', {
    isDeleted: false,
  })
  const post = [{ id: 'post', title: '该评论已删除' }]
  const note = [{ id: 'note', title: 'note' }]
  const recent = [{ id: 'recent', content: '该评论已删除' }]
  const like = [{ id: 'like' }]
  const activities = {
    comment: [live, comment('same-article', '该评论已删除'), explicitLive],
    post,
    note,
    recent,
    like,
  }

  const visible = filterDeletedCommentActivities(activities)

  assert.deepEqual(visible.comment, [live, explicitLive])
  for (const group of ['post', 'note', 'recent', 'like'])
    assert.equal(visible[group], activities[group])
  assert.equal(activities.comment.length, 3)
})

test('filters hydrated persisted data without requiring a new API response', () => {
  const cached = structuredClone({
    comment: [comment('article', '该评论已删除')],
    post: [{ id: 'post' }],
  })
  assert.deepEqual(filterDeletedCommentActivities(cached).comment, [])
  assert.deepEqual(cached.comment, [comment('article', '该评论已删除')])
})

test('handles empty activity groups and does not create missing comment data', () => {
  const empty = {}
  assert.equal(filterDeletedCommentActivities(empty), empty)
  assert.deepEqual(filterDeletedCommentActivities({ comment: [] }), {
    comment: [],
  })
  assert.deepEqual(
    filterDeletedCommentActivities({
      comment: [comment('article', '该评论已删除')],
    }),
    { comment: [] },
  )
})

test('does not mutate frozen activity data', () => {
  const activities = Object.freeze({
    comment: Object.freeze([
      Object.freeze(comment('deleted', '该评论已删除')),
      Object.freeze(comment('live', 'normal comment')),
    ]),
  })
  assert.deepEqual(
    filterDeletedCommentActivities(activities).comment.map((item) => item.id),
    ['live'],
  )
})

test('comment deletion refreshes the homepage without removing activities by article id', () => {
  const client = new QueryClient()
  const key = ['home-activity-recent']
  const activities = {
    comment: [comment('article', 'one'), comment('article', 'two')],
    post: [{ id: 'article' }],
  }
  client.setQueryData(key, activities)
  const invalidated = []
  client.invalidateQueries = (options) => {
    invalidated.push(options.queryKey)
    return Promise.resolve()
  }

  hideDeletedComment(client, 'article')

  assert.equal(client.getQueryData(key), activities)
  assert.ok(invalidated.some((queryKey) => queryKey[0] === key[0]))
  client.clear()
})
