import type { ReactEventHandler, RefObject } from 'react'

export const stopPropagation: ReactEventHandler<any> = (e) =>
  e.stopPropagation()

export const preventDefault: ReactEventHandler<any> = (e) => e.preventDefault()

let themeTransitionId = 0

export const transitionViewIfSupported = (
  updateCb: () => any,
  origin?: { x: number; y: number },
) => {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !document.startViewTransition
  ) {
    updateCb()
    return
  }

  const root = document.documentElement
  const id = ++themeTransitionId
  if (origin) {
    const { x, y } = origin
    const radius =
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      ) + 360
    root.style.setProperty('--theme-reveal-x', `${x}px`)
    root.style.setProperty('--theme-reveal-y', `${y}px`)
    root.style.setProperty('--theme-reveal-end', `${radius}px`)
    root.classList.add('theme-reveal')
  }

  const transition = document.startViewTransition(updateCb)
  const cleanup = () => {
    if (id !== themeTransitionId) return
    root.classList.remove('theme-reveal')
    root.style.removeProperty('--theme-reveal-x')
    root.style.removeProperty('--theme-reveal-y')
    root.style.removeProperty('--theme-reveal-end')
  }
  // A replaced transition may reject `finished`; both paths need cleanup.
  void transition.finished.then(cleanup, cleanup)
}

export function escapeSelector(selector: string) {
  return selector.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&')
}

export const nextFrame = (fn: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(fn))

export const textareaStyles = [
  'font',
  'width',
  'padding',
  'border',
  'boxSizing',
  'whiteSpace',
  'wordWrap',
  'lineHeight',
  'letterSpacing',
] as const
export const scrollTextareaToCursor = (
  taRef: RefObject<HTMLTextAreaElement>,
) => {
  const $ta = taRef.current
  if ($ta) {
    const div = document.createElement('div')
    const styles = getComputedStyle($ta)
    // 复制 textarea 的样式到 div
    textareaStyles.forEach((style) => {
      div.style[style] = styles[style]
    })
    div.style.position = 'absolute'
    div.style.top = '-9999px'
    div.style.left = '-9999px'

    // 将文本插入到 div 中，并在光标位置添加一个 span
    const start = $ta.selectionStart
    const end = $ta.selectionEnd
    const textBeforeCursor = $ta.value.substring(0, start)
    const textAfterCursor = $ta.value.substring(end)
    const textBeforeNode = document.createTextNode(textBeforeCursor)
    const cursorNode = document.createElement('span')
    cursorNode.id = 'cursor'
    const textAfterNode = document.createTextNode(textAfterCursor)

    div.append(textBeforeNode)
    div.append(cursorNode)
    div.append(textAfterNode)
    document.body.append(div)

    // 获取光标元素的位置
    const cursorSpan = document.getElementById('cursor')
    const cursorY = cursorSpan!.offsetTop
    const lineHeight = Number.parseInt(styles.lineHeight)
    // 移除临时 div
    document.body.removeChild(div)

    // 计算滚动位置
    const scrollTop = cursorY - $ta.clientHeight / 2 + lineHeight / 2
    $ta.scrollTop = Math.max(0, scrollTop)
  }
}
