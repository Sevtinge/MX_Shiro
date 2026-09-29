import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  advanceScrollTowardTarget,
  getElementDocumentTop,
} from './scroller-position.ts'

test('measures headings using the live viewport rectangle', () => {
  assert.equal(getElementDocumentTop(7316, 0), 7316)
  assert.equal(getElementDocumentTop(100, 7216), 7316)
})

test('moves toward a far heading without crossing it', () => {
  let state = { position: 0, velocity: 0 }
  for (let i = 0; i < 180; i++) {
    state = advanceScrollTowardTarget(state, 8700, 1)
    assert.ok(state.position >= 0 && state.position <= 8700)
  }
  assert.ok(Math.abs(state.position - 8700) < 2)
})

test('re-aims smoothly when asynchronous content shifts a heading', () => {
  let state = { position: 0, velocity: 0 }
  for (let i = 0; i < 12; i++) state = advanceScrollTowardTarget(state, 6800, 1)
  const beforeShift = state.position
  state = advanceScrollTowardTarget(state, 10200, 1)
  assert.ok(state.position > beforeShift)
  assert.ok(state.position < 10200)
  for (let i = 0; i < 180; i++)
    state = advanceScrollTowardTarget(state, 10200, 1)
  assert.ok(Math.abs(state.position - 10200) < 2)
})

test('does not overshoot when a later layout change brings the target closer', () => {
  let state = { position: 0, velocity: 0 }
  for (let i = 0; i < 16; i++) state = advanceScrollTowardTarget(state, 9000, 1)
  const distanceBefore = Math.abs(state.position - 5800)
  state = advanceScrollTowardTarget(state, 5800, 1)
  assert.ok(Math.abs(state.position - 5800) < distanceBefore)
  for (let i = 0; i < 180; i++)
    state = advanceScrollTowardTarget(state, 5800, 1)
  assert.ok(Math.abs(state.position - 5800) < 2)
})

test('caps elapsed time after a background-tab pause', () => {
  const state = { position: 200, velocity: 40 }
  assert.deepEqual(
    advanceScrollTowardTarget(state, 1000, 60),
    advanceScrollTowardTarget(state, 1000, 2),
  )
})
