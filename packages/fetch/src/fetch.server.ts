import 'server-only'

import { nanoid } from 'nanoid'
import { cookies, headers as nextHeaders } from 'next/headers'
import { createFetch } from 'ofetch'

import PKG from '~/../package.json'
import {
  parseSafeLineCookies,
  safeLineCookieName,
} from '~/lib/safeline-clearance'

import { createApiClient, createFetchAdapter, TokenKey } from './shared'

const isDev = process.env.NODE_ENV === 'development'
const createAppFetch = (publicOnly = false) =>
  createFetch({
    defaults: {
      timeout: 8000,

      onRequest(context) {
        const cookie = cookies()

        const token = publicOnly ? undefined : cookie.get(TokenKey)?.value

        // eslint-disable-next-line prefer-destructuring
        let headers: any = context.options.headers
        if (headers && headers instanceof Headers) {
          headers = Object.fromEntries(headers.entries())
        } else {
          headers = {}
        }
        if (token) {
          headers['Authorization'] = `bearer ${token}`
        }
        if (publicOnly) {
          delete headers.Authorization
          delete headers.authorization
          context.options.cache = 'no-store'
        }

        context.options.params ??= {}

        if (token) {
          context.options.params.r = nanoid()
        }

        if (context.options.params.token || token) {
          context.options.cache = 'no-store'
        }
        if (isDev) {
          console.info(`[Request/Server]: ${context.request}`)
        }

        const { get } = nextHeaders()

        const ua = get('user-agent')
        const ip =
          get('x-real-ip') ||
          get('x-forwarded-for') ||
          get('remote-addr') ||
          get('cf-connecting-ip')

        if (ip) {
          headers['x-real-ip'] = ip
          headers['x-forwarded-for'] = ip
        }

        headers['User-Agent'] =
          ua || `NextJS/v${PKG.dependencies.next} ${PKG.name}/${PKG.version}`

        const clearance = cookie.get(safeLineCookieName)?.value
        if (clearance) {
          try {
            const verifiedCookie = parseSafeLineCookies([
              Buffer.from(clearance, 'base64url').toString('utf8'),
            ])
            if (verifiedCookie) headers.Cookie = verifiedCookie
          } catch {}
        }
        context.options.headers = headers
      },
      onResponse(context) {
        if (isDev) {
          console.info(
            `[Response/Server]: ${context.request}`,
            context.response.status,
          )
        }
      },
    },
  })
export const $fetch = createAppFetch()
export const $publicFetch = createAppFetch(true)
export const publicApiClient = createApiClient(createFetchAdapter($publicFetch))
export const apiClient = createApiClient(createFetchAdapter($fetch))

const Noop = () => null
export const attachFetchHeader = () => Noop

export const setGlobalSearchParams = Noop
export const clearGlobalSearchParams = Noop

export const isReactServer = true
