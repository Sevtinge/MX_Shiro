import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  advanceWheelScroll,
  isLongformPath,
  wheelDeltaToPixels,
} from './wheel-inertia.ts'

test('normalizes pixel, line and page wheel distances', () => {
  assert.equal(wheelDeltaToPixels(100, 0, 800), 100)
  assert.equal(wheelDeltaToPixels(3, 1, 800), 54)
  assert.equal(wheelDeltaToPixels(-1, 2, 800), -800)
})

test('approaches either direction without overshooting', () => {
  const down = advanceWheelScroll(0, 200, 16)
  const up = advanceWheelScroll(200, 0, 16)
  assert.ok(down > 0 && down < 200)
  assert.ok(up > 0 && up < 200)
  assert.equal(advanceWheelScroll(199.8, 200, 16), 200)
  assert.equal(advanceWheelScroll(100, 200, 0), 100)
})

test('remains comparable across frame rates', () => {
  const oneFrame = advanceWheelScroll(0, 200, 32)
  const twoFrames = advanceWheelScroll(advanceWheelScroll(0, 200, 16), 200, 16)
  assert.ok(Math.abs(oneFrame - twoFrames) < 0.001)
})

test('keeps article and note details native, but smooths listings', () => {
  assert.equal(isLongformPath('/posts/tech/3'), true)
  assert.equal(isLongformPath('/notes/123'), true)
  assert.equal(isLongformPath('/posts'), false)
  assert.equal(isLongformPath('/posts/tech'), false)
  assert.equal(isLongformPath('/notes/topics/tech'), false)
  assert.equal(isLongformPath('/'), false)
})
