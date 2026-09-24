import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { API_URL } from '~/constants/env'
import { AuthKeyNames } from '~/lib/cookie'
import { getQueryClient } from '~/lib/query-client.server'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = request.cookies.get(AuthKeyNames[0])?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(
    `${API_URL.replace(/\/$/, '')}/snippets/group/theme`,
    request.nextUrl.origin,
  )
  try {
    // This endpoint requires owner authentication on the Mix Space API.
    const verification = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
    })
    if (!verification.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    revalidateTag('aggregate')
    await getQueryClient().invalidateQueries({
      queryKey: ['aggregate', 'shiro'],
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}
