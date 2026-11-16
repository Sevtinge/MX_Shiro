import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  mapAlgoliaPayload,
  mapDatabaseSearch,
} from './search-results.ts'

test('rejects the algolia-disabled error payload', () => {
  assert.equal(
    mapAlgoliaPayload({
      ok: 0,
      code: 10106,
      message: '无效的搜索类型: algolia',
    }),
    null,
  )
})

test('maps algolia post, note, and page rows', () => {
  assert.deepEqual(
    mapAlgoliaPayload({
      data: [
        {
          type: 'post',
          id: 'p1',
          title: '文稿',
          slug: 'hello',
          category: { name: '技术', slug: 'tech' },
        },
        { type: 'note', id: 'n1', title: '手记', nid: 5 },
        { type: 'page', id: 'g1', title: '关于', slug: 'about' },
        { type: 'post', id: 'p2', title: '缺分类', slug: 'x' },
      ],
    }),
    [
      {
        title: '文稿',
        subtitle: '技术',
        id: 'post-p1',
        url: '/posts/tech/hello',
      },
      { title: '手记', subtitle: '手记', id: 'note-n1', url: '/notes/5' },
      { title: '关于', subtitle: '页面', id: 'page-g1', url: '/about' },
    ],
  )
})

test('maps database post and note search payloads', () => {
  assert.deepEqual(
    mapDatabaseSearch(
      {
        data: [
          {
            id: 'p1',
            title: '爱沙尼亚',
            slug: 'ee',
            category: { name: 'SIMs', slug: 'sim' },
          },
        ],
      },
      { data: [{ id: 'n1', title: '山猪', nid: 5 }] },
    ),
    [
      {
        title: '爱沙尼亚',
        subtitle: 'SIMs',
        id: 'post-p1',
        url: '/posts/sim/ee',
      },
      { title: '山猪', subtitle: '手记', id: 'note-n1', url: '/notes/5' },
    ],
  )
})
