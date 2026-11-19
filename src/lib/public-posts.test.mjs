import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { beforeEach, test } from 'node:test'

let rows = [],
  calls = 0,
  list,
  children = []
const fake = {
  post: {
    getList: (...args) => {
      assert.ok(args[1] <= 50, 'backend page limit')
      calls++
      return list(...args)
    },
    getPost: async () => ({
      id: 'withdrawn',
      slug: 'draft',
      $raw: {},
      $serialized: { id: 'withdrawn' },
    }),
  },
  category: { getCategoryByIdOrSlug: async () => ({ name: '分类', children }) },
  aggregate: {},
}
globalThis[Symbol.for('test.public-posts')] = fake
registerHooks({
  resolve(specifier, context, next) {
    if (
      context.parentURL?.endsWith('/public-posts.ts') &&
      specifier === './request'
    )
      return {
        url: 'data:text/javascript,export const publicApiClient=globalThis[Symbol.for("test.public-posts")]',
        shortCircuit: true,
      }
    return next(specifier, context)
  },
})
const api = await import('./public-posts.ts')
beforeEach(() => {
  api.invalidatePublishedPosts()
  rows = [{ id: 'live' }]
  calls = 0
  children = []
  list = async () => ({ data: rows, pagination: { hasNextPage: false } })
})

test('concurrent requests share one fetch; the next request sees publication changes', async () => {
  const first = api.loadPublishedPosts(),
    second = api.loadPublishedPosts()
  assert.equal(first, second)
  assert.equal(calls, 1)
  await first
  rows = [{ id: 'new-live' }, { id: 'draft', isPublished: false }]
  assert.deepEqual(await api.loadPublishedPostIds(), new Set(['new-live']))
  assert.equal(calls, 2)
})
test('an old in-flight completion cannot overwrite an invalidated snapshot', async () => {
  const resolve = []
  list = () => new Promise((done) => resolve.push(done))
  const first = api.loadPublishedPosts()
  api.invalidatePublishedPosts()
  const second = api.loadPublishedPosts()
  resolve[0]({ data: [{ id: 'old' }], pagination: { hasNextPage: false } })
  await first
  assert.equal(api.loadPublishedPosts(), second)
  resolve[1]({ data: [{ id: 'new' }], pagination: { hasNextPage: false } })
  assert.deepEqual(
    (await second).map((p) => p.id),
    ['new'],
  )
})
test('failed fetches do not poison the next snapshot', async () => {
  list = async () => {
    throw new Error('offline')
  }
  await assert.rejects(api.loadPublishedPosts(), /offline/)
  list = async () => ({ data: rows, pagination: { hasNextPage: false } })
  assert.deepEqual(await api.loadPublishedPostIds(), new Set(['live']))
})
test('the public index follows every page without an arbitrary 20-page cutoff', async () => {
  list = async (page) => ({
    data: [{ id: String(page) }],
    pagination: { hasNextPage: page < 22 },
  })
  assert.equal((await api.loadPublishedPostIds()).size, 22)
})
test('categories hide drafts even when their payload has no status flag', async () => {
  children = [
    { id: 'live', title: '已发布' },
    { id: 'withdrawn', title: '草稿' },
  ]
  assert.deepEqual((await api.getPublicCategory('test')).children, [
    children[0],
  ])
})
test('unpublished article URLs cannot be exposed by detail or peek queries', async () => {
  await assert.rejects(
    api.getPublicPost('test', 'draft'),
    (error) => error.status === 404,
  )
})
