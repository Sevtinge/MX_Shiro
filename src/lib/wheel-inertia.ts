/** Native wheel events use pixels, lines or pages depending on the input device. */
export const wheelDeltaToPixels = (
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
) => {
  if (deltaMode === 1) return deltaY * 18
  if (deltaMode === 2) return deltaY * viewportHeight
  return deltaY
}

/** Exponential decay is frame-rate independent and cannot overshoot the target. */
export const advanceWheelScroll = (
  position: number,
  target: number,
  elapsedMs: number,
) => {
  const progress = 1 - Math.exp(-Math.min(Math.max(elapsedMs, 0), 48) / 105)
  const next = position + (target - position) * progress
  return Math.abs(target - next) < 0.6 ? target : next
}

/** Full-page prose keeps the browser's original, direct wheel scrolling. */
export const isLongformPath = (pathname: string) =>
  /^\/posts\/[^/]+\/[^/]+\/?$/.test(pathname) ||
  /^\/notes\/(?!topics(?:\/|$))[^/]+\/?$/.test(pathname)
