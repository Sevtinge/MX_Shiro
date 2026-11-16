'use client'

import { useEffect } from 'react'

export const useResetHover = (setActive: (active: boolean) => void) => {
  useEffect(() => {
    const reset = () => setActive(false)
    window.addEventListener('foreground-hover-reset', reset)
    return () => window.removeEventListener('foreground-hover-reset', reset)
  }, [setActive])
}
