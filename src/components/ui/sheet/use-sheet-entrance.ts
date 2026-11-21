import type { MotionProps } from 'motion/react'
import { useReducedMotion } from 'motion/react'
import { useContext } from 'react'

import { reboundPreset } from '~/constants/spring'

import { SheetContext } from './context'

export const useSheetEntrance = (index = 0): MotionProps => {
  const sheet = useContext(SheetContext)
  const reducedMotion = useReducedMotion()
  if (!sheet?.touchFriendly) return { initial: false }

  return {
    initial: reducedMotion ? false : { y: 30, opacity: 0 },
    animate: sheet.isOpen
      ? { y: 0, opacity: 1 }
      : { y: reducedMotion ? 0 : 16, opacity: 0 },
    transition: sheet.isOpen
      ? {
          ...reboundPreset,
          delay: reducedMotion ? 0 : Math.min(index, 6) * 0.08,
          ...(reducedMotion ? { duration: 0.1, type: 'tween' } : {}),
        }
      : { duration: 0.16, ease: 'easeOut' },
  }
}
