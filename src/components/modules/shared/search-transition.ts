export interface SearchBounds {
  x: number
  y: number
  width: number
  height: number
  borderRadius: number
}

export const getSearchPanelBounds = (
  viewportWidth: number,
  viewportHeight: number,
  remSize = 16,
): SearchBounds => {
  const width = Math.min(
    40 * remSize,
    Math.max(0, viewportWidth - 1.5 * remSize),
  )
  const height = Math.min(32 * remSize, viewportHeight * 0.8)
  return {
    x: (viewportWidth - width) / 2,
    y: (viewportHeight - height) / 2,
    width,
    height,
    borderRadius: remSize,
  }
}

export const getSearchTriggerBounds = (
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): SearchBounds => ({
  x: rect.left,
  y: rect.top,
  width: rect.width,
  height: rect.height,
  borderRadius: Math.min(rect.width, rect.height) / 2,
})
