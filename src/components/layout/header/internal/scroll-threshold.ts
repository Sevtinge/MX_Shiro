export const HEADER_BG_SCROLL_START = 84 + 63 + 50
export const DETAIL_HEADER_BG_SCROLL_START = 112
export const HEADER_BG_TRANSITION_DISTANCE = 50

export const getHeaderBgScrollStart = (
  pathname: string,
  viewportHeight: number,
) => {
  if (pathname === '/') {
    return viewportHeight > 0 ? viewportHeight : HEADER_BG_SCROLL_START
  }

  if (
    /^\/posts\/[^/]+\/[^/]+\/?$/.test(pathname) ||
    /^\/notes\/[^/]+\/?$/.test(pathname)
  ) {
    return DETAIL_HEADER_BG_SCROLL_START
  }

  return HEADER_BG_SCROLL_START
}

export const getHeaderBackgroundOpacity = (
  scrollY: number,
  start: number,
  enabled: boolean,
) => {
  if (scrollY <= start || !enabled) return 0
  if (scrollY >= start + HEADER_BG_TRANSITION_DISTANCE) return 1
  return (
    Math.floor(((scrollY - start) / HEADER_BG_TRANSITION_DISTANCE) * 100) / 100
  )
}
