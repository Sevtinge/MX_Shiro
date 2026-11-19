import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  isSameOriginSafeLineRequest,
  parseSafeLineCookies,
  safeLineCookieName,
} from '~/lib/safeline-clearance'

export const POST = async (request: NextRequest) => {
  const protocol =
    request.headers.get('x-forwarded-proto') || request.nextUrl.protocol
  // Next's internal URL may use localhost after proxying. Compare the browser
  // Origin with the actual request Host, retaining the protocol/port check.
  if (
    !isSameOriginSafeLineRequest(
      request.headers.get('origin'),
      request.headers.get('host'),
      protocol,
    )
  )
    return new NextResponse(null, { status: 403 })
  try {
    const cookie = parseSafeLineCookies((await request.json()).cookies)
    if (!cookie) return new NextResponse(null, { status: 400 })
    const response = NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    response.cookies.set(
      safeLineCookieName,
      Buffer.from(cookie).toString('base64url'),
      {
        httpOnly: true,
        secure: protocol.replace(/:$/, '') === 'https',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      },
    )
    return response
  } catch {
    return new NextResponse(null, { status: 400 })
  }
}
