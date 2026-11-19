import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  parseSafeLineCookies,
  safeLineCookieName,
} from '~/lib/safeline-clearance'

export const dynamic = 'force-dynamic'

export const GET = async (request: NextRequest) => {
  const headers = new Headers({ accept: 'application/json' })
  const ip =
    request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
  const agent = request.headers.get('user-agent')
  if (ip) {
    headers.set('x-real-ip', ip)
    headers.set('x-forwarded-for', ip)
  }
  if (agent) headers.set('user-agent', agent)
  try {
    const clearance = request.cookies.get(safeLineCookieName)?.value
    if (clearance) {
      const cookie = parseSafeLineCookies([
        Buffer.from(clearance, 'base64url').toString('utf8'),
      ])
      if (cookie) headers.set('cookie', cookie)
    }
    // Only the configured API is probed; the request cannot choose an origin
    // or turn this endpoint into a proxy. Do not expose the upstream body.
    const api =
      process.env.NEXT_PUBLIC_CLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL
    if (!api) throw new Error('API unavailable')
    const url = new URL('server-time', `${api.replace(/\/$/, '')}/`)
    if (url.origin === request.nextUrl.origin)
      throw new Error('API must be external')
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    await response.body?.cancel()
    return NextResponse.json(
      { required: response.status === 468 },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { required: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
