'use client'

import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import { searchPanelOpenAtom } from '~/atoms/search-panel'
import { modalStackAtom } from '~/components/ui/modal'
import { sheetStackAtom } from '~/components/ui/sheet'

export const ForegroundPointerGuard = () => {
  const modalCount = useAtomValue(modalStackAtom).length
  const sheetCount = useAtomValue(sheetStackAtom).length
  const searchOpen = useAtomValue(searchPanelOpenAtom)
  const open = modalCount > 0 || sheetCount > 0 || searchOpen

  useEffect(() => {
    const root = document.documentElement
    const page = document.querySelector('[data-theme]')
    root.toggleAttribute('data-foreground-window', open)
    if (page instanceof HTMLElement) {
      page.inert = open
      const active = document.activeElement
      if (open && active instanceof HTMLElement && page.contains(active)) {
        active.blur()
      }
    }
    window.dispatchEvent(new Event('foreground-hover-reset'))
  }, [open, modalCount, sheetCount, searchOpen])

  return null
}
