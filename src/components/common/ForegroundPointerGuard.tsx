'use client'

import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import { searchPanelOpenAtom } from '~/atoms/search-panel'
import { modalStackAtom } from '~/components/ui/modal'
import { sheetStackAtom } from '~/components/ui/sheet'

const scrollsOnY = (node: HTMLElement, deltaY: number) => {
  const { overflowY } = getComputedStyle(node)
  if (!/^(?:auto|scroll|overlay)$/.test(overflowY)) return false
  if (node.scrollHeight <= node.clientHeight + 1) return false
  if (deltaY < 0) return node.scrollTop > 0
  return node.scrollTop + node.clientHeight < node.scrollHeight - 1
}

/** Let a popup list scroll, but never the page or a window underneath. */
const wheelStaysInFront = (target: EventTarget | null, deltaY: number) => {
  let node = target instanceof HTMLElement ? target : null
  while (node && node !== document.documentElement) {
    if (
      node.dataset.pageShell !== undefined ||
      node.dataset.windowBlocked !== undefined
    ) {
      return false
    }
    if (scrollsOnY(node, deltaY)) return true
    node = node.parentElement
  }
  return false
}

export const ForegroundPointerGuard = () => {
  const modalCount = useAtomValue(modalStackAtom).length
  const sheetCount = useAtomValue(sheetStackAtom).length
  const searchOpen = useAtomValue(searchPanelOpenAtom)
  const open = modalCount > 0 || sheetCount > 0 || searchOpen

  useEffect(() => {
    const root = document.documentElement
    const page = document.querySelector('[data-page-shell]')
    root.toggleAttribute('data-foreground-window', open)
    if (page instanceof HTMLElement && page.contains(document.activeElement)) {
      const active = document.activeElement
      if (open && active instanceof HTMLElement) active.blur()
    }
    window.dispatchEvent(new Event('foreground-hover-reset'))
    if (!open) return

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      if (wheelStaysInFront(event.target, event.deltaY)) return
      event.preventDefault()
    }
    document.addEventListener('wheel', onWheel, { capture: true, passive: false })
    return () => document.removeEventListener('wheel', onWheel, { capture: true })
  }, [open, modalCount, sheetCount, searchOpen])

  return null
}
