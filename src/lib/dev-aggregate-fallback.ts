import type { AggregateRoot } from '@mx-space/api-client'

import { defaultLinkSections } from '~/components/layout/footer/config'

const now = '2026-01-01T00:00:00.000Z'

export const devAggregateFallback = {
  user: {
    id: 'local-preview',
    name: '本地预览',
    username: 'preview',
    introduce: '',
    mail: '',
    url: 'http://127.0.0.1:2323',
    socialIds: {},
    avatar: '',
    created: now,
    modified: now,
    v: 0,
    lastLoginTime: now,
    postID: '',
  },
  seo: {
    title: '本地预览',
    description: 'API 未连接时的页面预览',
    keywords: [],
  },
  url: {
    webUrl: 'http://127.0.0.1:2323',
    serverUrl: 'http://127.0.0.1:12334',
    wsUrl: 'ws://127.0.0.1:12334',
  },
  categories: [],
  pageMeta: [
    {
      id: 'about-me',
      title: '关于我',
      slug: 'about-me',
      order: 0,
    },
  ],
  latestNoteId: {
    id: '0',
    nid: 0,
  },
  theme: {
    config: {
      site: {
        favicon: '/favicon.ico',
      },
      hero: {
        title: {
          template: [{ type: 'title', text: '本地预览' }],
        },
        description: '',
      },
      module: {
        donate: {
          enable: false,
          link: '',
          qrcode: [],
        },
        bilibili: {},
        activity: {
          enable: false,
          endpoint: '',
        },
      },
    },
    footer: {
      linkSections: defaultLinkSections,
      otherInfo: {
        date: '2026',
      },
    },
  },
} as AggregateRoot & {
  theme: AppThemeConfig
}

export const isAggregateOfflineError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  const cause = (error as { cause?: { code?: string } })?.cause?.code
  return (
    cause === 'ECONNREFUSED' ||
    cause === 'ENOTFOUND' ||
    message.includes('ECONNREFUSED') ||
    message.includes('fetch failed') ||
    message.includes('无法连接')
  )
}
