import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  DETAIL_HEADER_BG_SCROLL_START,
  getHeaderBackgroundOpacity,
  getHeaderBgScrollStart,
  HEADER_BG_SCROLL_START,
  HEADER_BG_TRANSITION_DISTANCE,
} from './scroll-threshold.ts'

test('homepage remains floating throughout the initially visible viewport', () => {
  assert.equal(getHeaderBgScrollStart('/', 820), 820)
  assert.equal(getHeaderBgScrollStart('/', 2204), 2204)
  assert.equal(getHeaderBgScrollStart('/', 0), HEADER_BG_SCROLL_START)
  assert.equal(HEADER_BG_TRANSITION_DISTANCE, 50)
})

test('post and note detail pages switch earlier', () => {
  assert.ok(DETAIL_HEADER_BG_SCROLL_START < HEADER_BG_SCROLL_START)
  assert.equal(
    getHeaderBgScrollStart('/posts/tech/3', 820),
    DETAIL_HEADER_BG_SCROLL_START,
  )
  assert.equal(
    getHeaderBgScrollStart('/notes/123456', 820),
    DETAIL_HEADER_BG_SCROLL_START,
  )
  assert.equal(
    getHeaderBgScrollStart('/posts/tech/3/', 820),
    DETAIL_HEADER_BG_SCROLL_START,
  )
})

test('listing and unrelated routes keep their existing threshold', () => {
  for (const path of [
    '/posts',
    '/posts/tech',
    '/notes',
    '/timeline',
    '/friends',
  ]) {
    assert.equal(getHeaderBgScrollStart(path, 820), HEADER_BG_SCROLL_START)
  }
})

test('homepage header stays floating to the viewport edge and fades in after it', () => {
  const start = getHeaderBgScrollStart('/', 820)
  assert.equal(getHeaderBackgroundOpacity(819, start, true), 0)
  assert.equal(getHeaderBackgroundOpacity(820, start, true), 0)
  assert.equal(getHeaderBackgroundOpacity(845, start, true), 0.5)
  assert.equal(getHeaderBackgroundOpacity(870, start, true), 1)
})

test('detail header fades in earlier and respects disabled backgrounds', () => {
  const start = getHeaderBgScrollStart('/posts/tech/3', 820)
  assert.equal(getHeaderBackgroundOpacity(111, start, true), 0)
  assert.equal(getHeaderBackgroundOpacity(120, start, true), 0.16)
  assert.equal(getHeaderBackgroundOpacity(162, start, true), 1)
  assert.equal(getHeaderBackgroundOpacity(500, start, false), 0)
})
