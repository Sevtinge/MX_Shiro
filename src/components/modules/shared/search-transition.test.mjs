import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getSearchPanelBounds,
  getSearchTriggerBounds,
} from './search-transition.ts'

test('desktop search remains centered at the existing dialog size', () => {
  const panel = getSearchPanelBounds(1440, 900)
  assert.equal(panel.width, 640)
  assert.equal(panel.height, 512)
  assert.equal(panel.x + panel.width / 2, 720)
  assert.equal(panel.y + panel.height / 2, 450)
})

test('narrow and landscape viewports keep the dialog inside the screen', () => {
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    const panel = getSearchPanelBounds(width, height)
    assert.ok(panel.x >= 12)
    assert.ok(panel.x + panel.width <= width - 12)
    assert.ok(panel.y >= height * 0.1 - 1)
    assert.ok(panel.y + panel.height <= height * 0.9 + 1)
  }
})

test('the panel preserves the site font scale', () => {
  const panel = getSearchPanelBounds(1440, 900, 14)
  assert.equal(panel.width, 560)
  assert.equal(panel.height, 448)
  assert.equal(panel.borderRadius, 14)
})

test('the transition starts at the exact circle edge in either header layout', () => {
  for (const left of [64, 1060]) {
    const origin = getSearchTriggerBounds({
      left,
      top: 16,
      width: 40,
      height: 40,
    })
    assert.equal(origin.x, left)
    assert.equal(origin.y, 16)
    assert.equal(origin.width, 40)
    assert.equal(origin.height, 40)
    assert.equal(origin.borderRadius, 20)
  }
})
