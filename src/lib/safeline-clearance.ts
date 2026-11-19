export const safeLineCookieName = 'shiro-safeline-clearance'

export const parseSafeLineCookies = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length !== 1) return null
  const [cookie] = value
  // Only the vendor's verification JWT is accepted. Never relay login cookies.
  if (
    typeof cookie !== 'string' ||
    !/^sl-challenge-jwt=[\w.~-]{1,4096}$/.test(cookie)
  )
    return null
  return cookie
}

export const isSameOriginSafeLineRequest = (
  origin: string | null,
  host: string | null,
  protocol: string,
) => {
  if (!origin || !host) return false
  try {
    const url = new URL(origin)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin === origin &&
      url.host === host &&
      url.protocol === `${protocol.replace(/:$/, '')  }:`
    )
  } catch {
    return false
  }
}
