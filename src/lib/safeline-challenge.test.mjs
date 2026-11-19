import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import {
  finishSafeLineVerification,
  getSafeLineChallenge,
  safeLineProbeUrl,
  withSafeLineVerification,
} from './safeline-challenge.ts'
import {
  isSameOriginSafeLineRequest,
  parseSafeLineCookies,
} from './safeline-clearance.ts'

const api = 'https://api-blog.sevtinge.com/api/v2'
const blocked = () =>
  Object.assign(new Error('verification required'), {
    status: 468,
    response: { status: 468 },
  })
const client = (run) =>
  Object.assign(run, {
    raw: run,
    native: globalThis.fetch,
    create: () => client(run),
  })
beforeEach(() => {
  globalThis.window = { location: { href: 'https://sevtinge.com/posts' } }
})
afterEach(() => {
  delete globalThis.window
})
const waitForDialog = async () => {
  for (let i = 0; i < 20 && !getSafeLineChallenge(); i++)
    await new Promise((resolve) => setImmediate(resolve))
  assert.ok(getSafeLineChallenge())
}

test('verification URL discards query credentials and never replays mutations in a frame', () => {
  assert.equal(
    safeLineProbeUrl(`${api}/`, 'https://sevtinge.com'),
    `${api}/server-time`,
  )
  assert.equal(
    safeLineProbeUrl('/api/v2', 'https://sevtinge.com/posts'),
    'https://sevtinge.com/api/v2/server-time',
  )
})
test('multiple blocked requests share one dialog and retry once after verification', async () => {
  let count = 0
  const fetcher = withSafeLineVerification(
    client(async () => {
      if (++count <= 2) throw blocked()
      return 'ok'
    }),
    api,
  )
  const first = fetcher(`${api}/posts`),
    second = fetcher(`${api}/categories`)
  await waitForDialog()
  const state = getSafeLineChallenge()
  assert.equal(state.url, `${api}/safeline-verify`)
  assert.equal(state.probeUrl, `${api}/server-time`)
  finishSafeLineVerification(true)
  assert.deepEqual(await Promise.all([first, second]), ['ok', 'ok'])
  assert.equal(count, 4)
  assert.equal(getSafeLineChallenge(), null)
})
test('a repeated 468 is surfaced without an infinite verification loop', async () => {
  let count = 0
  const fetcher = withSafeLineVerification(
    client(async () => {
      count++
      throw blocked()
    }),
    api,
  )
  const result = fetcher(`${api}/posts`)
  await waitForDialog()
  finishSafeLineVerification(true)
  await assert.rejects(result, (e) => e.status === 468)
  assert.equal(count, 2)
  assert.equal(getSafeLineChallenge(), null)
})
test('cancelling verification does not replay a write', async () => {
  let count = 0
  const fetcher = withSafeLineVerification(
    client(async () => {
      count++
      throw blocked()
    }),
    api,
  )
  const result = fetcher(`${api}/comments`, {
    method: 'POST',
    body: { text: 'hello' },
  })
  await waitForDialog()
  finishSafeLineVerification(false)
  await assert.rejects(result, /取消/)
  assert.equal(count, 1)
})
test('ordinary 403 errors are never treated as a SafeLine challenge', async () => {
  const fetcher = withSafeLineVerification(
    client(async () => {
      throw Object.assign(new Error('API rate limit'), {
        response: { status: 403 },
      })
    }),
    api,
  )
  await assert.rejects(fetcher('https://api.github.com/'), /API rate/)
  assert.equal(getSafeLineChallenge(), null)
})
test('an aborted request is not replayed after another request finishes verification', async () => {
  const controller = new AbortController()
  let count = 0
  const fetcher = withSafeLineVerification(
    client(async () => {
      count++
      throw blocked()
    }),
    api,
  )
  const result = fetcher(`${api}/posts`, { signal: controller.signal })
  await waitForDialog()
  controller.abort()
  finishSafeLineVerification(true)
  await assert.rejects(result)
  assert.equal(count, 1)
})
test('clearance relay accepts only the WAF JWT and rejects auth cookies/header injection', () => {
  assert.equal(
    parseSafeLineCookies(['sl-challenge-jwt=eyJ.verified.sig']),
    'sl-challenge-jwt=eyJ.verified.sig',
  )
  for (const value of [
    null,
    [],
    ['mx-token=secret'],
    ['sl-challenge-jwt=ok; mx-token=secret'],
    ['sl-challenge-jwt=x\r\nHost: other'],
    ['sl-challenge-jwt=x', 'mx-token=x'],
  ])
    assert.equal(parseSafeLineCookies(value), null)
})

test('CORS-hidden failures confirm verification without replaying uncertain writes', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ required: true }),
  })
  let count = 0
  try {
    const fetcher = withSafeLineVerification(
      client(async () => {
        count++
        throw new TypeError('Failed to fetch')
      }),
      api,
    )
    const result = fetcher(`${api}/comments`, {
      method: 'POST',
      body: { text: 'once' },
    })
    await waitForDialog()
    finishSafeLineVerification(true)
    await assert.rejects(result, /Failed to fetch/)
    assert.equal(count, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('clearance origin validation handles proxies without admitting foreign origins', () => {
  assert.equal(
    isSameOriginSafeLineRequest(
      'http://127.0.0.1:2323',
      '127.0.0.1:2323',
      'http:',
    ),
    true,
  )
  assert.equal(
    isSameOriginSafeLineRequest(
      'https://sevtinge.com',
      'sevtinge.com',
      'https',
    ),
    true,
  )
  for (const origin of [
    null,
    'null',
    'https://evil.test',
    'https://sevtinge.com.evil.test',
    'http://sevtinge.com',
    'https://sevtinge.com:443/path',
  ]) {
    assert.equal(
      isSameOriginSafeLineRequest(origin, 'sevtinge.com', 'https'),
      false,
      String(origin),
    )
  }
})
