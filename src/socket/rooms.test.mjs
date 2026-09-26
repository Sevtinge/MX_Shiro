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
  assert.equal(isArticleRoomName(`article_${id}`), false)
  assert.equal(getArticleRoomCount({ [`article-${id}`]: 2 }, id), 2)
  assert.equal(getArticleRoomCount({ [`article_${id}`]: 2 }, id), 0)
})
