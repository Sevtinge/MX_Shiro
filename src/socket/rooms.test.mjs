import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getArticleRoomCount,
  getArticleRoomName,
  isArticleRoomName,
} from './rooms.ts'

test('uses the gateway article room prefix for subscriptions and room counts', () => {
  const id = '507f1f77bcf86cd799439011'
  assert.equal(getArticleRoomName(id), `article-${id}`)
  assert.equal(isArticleRoomName(`article-${id}`), true)
  assert.equal(isArticleRoomName(`article_${id}`), true)
  assert.equal(getArticleRoomCount({ [`article-${id}`]: 2 }, id), 2)
  assert.equal(getArticleRoomCount({ [`article_${id}`]: 2 }, id), 2)
})

test('reads counts after room names are camelcased', () => {
  assert.equal(
    getArticleRoomCount({ articlePreviewPostWs: 3 }, 'preview-post-ws'),
    3,
  )
  assert.equal(
    getArticleRoomCount(
      { articleA07f1f77bcf86cd799439011: 4 },
      'a07f1f77bcf86cd799439011',
    ),
    4,
  )
  assert.equal(isArticleRoomName('articlePreviewPostWs'), true)
  assert.equal(isArticleRoomName('home'), false)
})

test('reads the live gateway count key that uses an underscore', () => {
  const id = '6ab930f7e99146725880ebb3'
  assert.equal(getArticleRoomCount({ [`article_${id}`]: 1 }, id), 1)
  assert.equal(isArticleRoomName(`article_${id}`), true)
  assert.equal(isArticleRoomName('home'), false)
})
