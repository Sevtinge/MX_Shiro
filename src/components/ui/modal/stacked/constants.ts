import type { MotionProps, TargetAndTransition } from 'motion/react'

import { microReboundPreset } from '~/constants/spring'

const enterStyle: TargetAndTransition = {
  scale: 1,
  opacity: 1,
  x: 0,
  y: 0,
}
const initialStyle: TargetAndTransition = {
  scale: 0.98,
  opacity: 0,
  x: 0,
  y: 10,
}

export const modalMontionConfig: MotionProps = {
  initial: initialStyle,
  animate: enterStyle,
  exit: initialStyle,
  transition: microReboundPreset,
}

export const MODAL_STACK_Z_INDEX = 100
