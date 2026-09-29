import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getPostPreviewImage } from './post-preview-image.ts'

test('prefers the explicitly configured post cover', () => {
  assert.equal(
    getPostPreviewImage({
      meta: { cover: 'https://example.com/cover.jpg' },
      images: [{ src: 'https://example.com/first.jpg' }],
    }),
    'https://example.com/cover.jpg',
  )
})

test('falls back to the original first-image behavior', () => {
  assert.equal(
    getPostPreviewImage({
      meta: {},
      images: [
        { src: 'https://example.com/first.jpg' },
        { src: 'https://example.com/second.jpg' },
      ],
    }),
    'https://example.com/first.jpg',
  )
})

test('treats an empty cover as unset', () => {
  assert.equal(
    getPostPreviewImage({
      meta: { cover: '   ' },
      images: [{ src: 'https://example.com/first.jpg' }],
    }),
    'https://example.com/first.jpg',
  )
})

test('renders no thumbnail when neither source exists', () => {
  assert.equal(getPostPreviewImage({ meta: {}, images: [] }), null)
  assert.equal(getPostPreviewImage({}), null)
})
