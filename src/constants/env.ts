import { env } from 'next-runtime-env'

import { isClientSide, isDev } from '~/lib/env'

export const API_URL: string = (() => {
  if (isDev) return env('NEXT_PUBLIC_API_URL') || ''

  if (isClientSide) {
    // Keep browser API calls same-origin by default so Cloudflare challenges
    // on the API hostname do not block fetches from the site.
    return env('NEXT_PUBLIC_CLIENT_API_URL') || '/api/v2'
  }

  return env('NEXT_PUBLIC_API_URL') || '/api/v2'
})() as string
export const GATEWAY_URL = env('NEXT_PUBLIC_GATEWAY_URL') || ''
