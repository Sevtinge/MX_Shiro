import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isPublishedPreviewItem } from './published-preview.ts'

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
