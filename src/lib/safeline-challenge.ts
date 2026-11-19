import type { $Fetch, FetchOptions, FetchRequest } from 'ofetch'

export type SafeLineChallenge = {
  url: string
  probeUrl: string
  startedAt: number
}
let challenge: SafeLineChallenge | null = null
let pending: Promise<void> | null = null
let settle: ((verified: boolean) => void) | undefined
const listeners = new Set<() => void>()

export const subscribeSafeLine = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getSafeLineChallenge = () => challenge
export const getServerSafeLineChallenge = () => null

export const safeLineProbeUrl = (apiUrl: string, pageUrl?: string) => {
  const base = new URL(apiUrl.replace(/\/?$/, '/'), pageUrl)
  // A fixed, read-only endpoint: never embed a token, password or request body
  // in the verification frame or the external-window fallback.
  return new URL('server-time', base).href
}

export const finishSafeLineVerification = (verified: boolean) =>
  settle?.(verified)

export const requestSafeLineVerification = (apiUrl: string): Promise<void> => {
  if (typeof window === 'undefined')
    return Promise.reject(new Error('请在浏览器中完成安全验证'))
  if (pending) return pending
  const probeUrl = safeLineProbeUrl(apiUrl, window.location.href)
  challenge = {
    url: new URL('safeline-verify', probeUrl).href,
    probeUrl,
    startedAt: Date.now(),
  }
  pending = new Promise<void>((resolve, reject) => {
    settle = (verified) => {
      challenge = null
      pending = null
      settle = undefined
      for (const listener of listeners) listener()
      if (verified) resolve()
      else
        reject(
          Object.assign(new Error('安全验证已取消，请重试'), {
            name: 'SafeLineVerificationCancelled',
          }),
        )
    }
  })
  for (const listener of listeners) listener()
  return pending
}

export const isSafeLineError = (error: unknown) => {
  const value = error as {
    status?: number
    statusCode?: number
    response?: { status?: number }
  } | null
  return (value?.response?.status ?? value?.statusCode ?? value?.status) === 468
}

let statusProbe: Promise<boolean> | undefined
export const probeSafeLineStatus = () => {
  if (!statusProbe) {
    const request = fetch('/api/safeline/status', {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
      .then(
        async (response) =>
          response.ok && (await response.json()).required === true,
      )
      .catch(() => false)
    statusProbe = request
    void request.then(() => {
      if (statusProbe === request) statusProbe = undefined
    })
  }
  return statusProbe
}

export const withSafeLineVerification = (
  fetcher: $Fetch,
  apiUrl?: string,
): $Fetch => {
  const run = async <T>(
    operation: () => Promise<T>,
    options?: FetchOptions,
  ) => {
    try {
      return await operation()
    } catch (error) {
      if (typeof window === 'undefined' || options?.signal?.aborted) throw error
      const response = (error as { response?: Response })?.response
      const knownStatus =
        (error as { status?: number; statusCode?: number })?.status ??
        (error as { statusCode?: number })?.statusCode
      if (knownStatus && knownStatus !== 468) throw error
      // WAF responses may omit CORS headers, hiding the 468 from browser JS.
      // Confirm with our same-origin status endpoint before opening a dialog.
      if (
        !isSafeLineError(error) &&
        (response || !(await probeSafeLineStatus()))
      )
        throw error
      // ofetch's timeout has already been cleared. A CAPTCHA can take much
      // longer than an API call without aborting the pending verification.
      const configuredUrl = apiUrl ?? (await import('~/constants/env')).API_URL
      await requestSafeLineVerification(configuredUrl)
      if (options?.signal?.aborted) throw error
      if (
        !isSafeLineError(error) &&
        !['GET', 'HEAD'].includes(
          String(options?.method || 'GET').toUpperCase(),
        )
      )
        throw error
      // 468 is returned before the origin processes the request. Retry once;
      // a repeated challenge is surfaced rather than looping indefinitely.
      return operation()
    }
  }
  const wrapped = ((request: FetchRequest, options?: FetchOptions) =>
    run(() => fetcher(request, options), options)) as $Fetch
  wrapped.raw = ((request: FetchRequest, options?: FetchOptions) =>
    run(() => fetcher.raw(request, options), options)) as $Fetch['raw']
  wrapped.native = fetcher.native
  wrapped.create = (...args) =>
    withSafeLineVerification(fetcher.create(...args), apiUrl)
  return wrapped
}
