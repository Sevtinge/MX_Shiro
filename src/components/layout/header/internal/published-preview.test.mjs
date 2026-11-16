import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  filterToPublishedIds,
  isPublishedPreviewItem,
} from './published-preview.ts'

test('keeps published items and items with no publish flag', () => {
  assert.equal(isPublishedPreviewItem({}), true)
  assert.equal(isPublishedPreviewItem({ isPublished: true }), true)
  assert.equal(isPublishedPreviewItem({ isPublished: 1 }), true)
  assert.equal(isPublishedPreviewItem({ status: 'published' }), true)
  assert.equal(isPublishedPreviewItem({ status: '已发布' }), true)
})

test('drops drafts from the nav preview', () => {
  assert.equal(isPublishedPreviewItem({ isPublished: false }), false)
  assert.equal(isPublishedPreviewItem({ isPublished: 0 }), false)
  assert.equal(isPublishedPreviewItem({ status: 'draft' }), false)
  assert.equal(isPublishedPreviewItem({ status: '草稿' }), false)
  assert.equal(
    isPublishedPreviewItem({ isPublished: false, status: 'published' }),
    false,
  )
})

test('reads the snake_case publish flag and hidden notes', () => {
  assert.equal(isPublishedPreviewItem({ is_published: false }), false)
  assert.equal(isPublishedPreviewItem({ is_published: true }), true)
  assert.equal(isPublishedPreviewItem({ hide: true }), false)
})

test('category previews keep only ids from the published list', () => {
  const rows = [
    { id: 'draft-test', title: '测试', slug: 'test' },
    { id: 'draft-voja', title: 'Vojazento', slug: 'vojazento100' },
    { id: 'live', title: 'Phigros', slug: '3' },
  ]
  assert.deepEqual(
    filterToPublishedIds(rows, new Set(['live'])).map((row) => row.slug),
    ['3'],
  )
})
