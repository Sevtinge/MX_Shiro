import assert from 'node:assert/strict'
import { test } from 'node:test'

import createClient from '@mx-space/api-client'

import { submitComment } from './comment-request.ts'

const apiUrl = 'https://api-blog.example.com/api/v2'
const refId = '6ab930f7e99146725880ebb3'
const text = '评论接口回归测试'

const createRecordingClient = (post) =>
  createClient({
    default: {},
    post,
  })(apiUrl, {
    controllers: [],
    getDataFromResponse: (response) => response,
  })

const cases = [
  [
    'guest comment',
    {},
    'guest',
    { text, author: 'Guest', mail: 'guest@example.com', isWhispers: true },
  ],
  [
    'guest reply',
    { isReply: true },
    'guest/reply',
    { text, author: 'Guest', mail: 'guest@example.com' },
  ],
  ['reader comment', { isReader: true }, 'reader', { text, isWhispers: true }],
  ['reader reply', { isReader: true, isReply: true }, 'reader/reply', { text }],
  ['owner comment with token', { isOwner: true }, 'reader', { text }],
  [
    'owner reply with token',
    { isOwner: true, isReply: true },
    'owner-reply',
    { text },
  ],
  [
    'owner comment with session',
    { isOwner: true, isReader: true },
    'reader',
    { text },
  ],
  [
    'owner reply with session',
    { isOwner: true, isReader: true, isReply: true },
    'owner-reply',
    { text },
  ],
]

for (const [name, identity, route, data] of cases) {
  test(`submits ${name} to the Core v11 route with the correct body`, async () => {
    const requests = []
    const client = createRecordingClient(async (url, options) => {
      requests.push({ url, options })
      return { id: 'new-comment', text }
    })
    const result = await submitComment(client, {
      refId,
      text,
      author: 'Guest',
      mail: 'guest@example.com',
      avatar: '',
      url: '',
      isWhispers: true,
      ...identity,
    })

    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, `${apiUrl}/comments/${route}/${refId}`)
    assert.deepEqual(requests[0].options.data, data)
    assert.equal(result.id, 'new-comment')
    assert.equal(result.text, text)
  })
}

test('preserves non-empty guest website and avatar fields', async () => {
  let request
  const client = createRecordingClient(async (_url, options) => {
    request = options
    return { id: 'new-comment', text }
  })

  await submitComment(client, {
    refId,
    text,
    author: 'Guest',
    mail: 'guest@example.com',
    url: 'https://example.com',
    avatar: 'https://example.com/avatar.png',
    isWhispers: false,
  })

  assert.deepEqual(request.data, {
    text,
    author: 'Guest',
    mail: 'guest@example.com',
    url: 'https://example.com',
    avatar: 'https://example.com/avatar.png',
    isWhispers: false,
  })
})

test('does not send cached guest profile fields for authenticated comments', async () => {
  let request
  const client = createRecordingClient(async (_url, options) => {
    request = options
    return { id: 'new-comment', text }
  })

  await submitComment(client, {
    refId,
    text,
    isReader: true,
    author: 'Old guest profile',
    mail: 'old@example.com',
    url: 'https://example.com',
    avatar: 'https://example.com/avatar.png',
  })

  assert.deepEqual(request.data, { text })
})

test('does not retry failed submissions through another identity route', async () => {
  const requests = []
  const client = createRecordingClient(async (url) => {
    requests.push(url)
    throw new Error('Not logged in')
  })

  await assert.rejects(
    submitComment(client, { refId, text, isReader: true }),
    /Not logged in/,
  )
  assert.deepEqual(requests, [`${apiUrl}/comments/reader/${refId}`])
})
