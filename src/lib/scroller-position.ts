/** Positions must use the live viewport rect, not the offset-parent chain. */
export const getElementDocumentTop = (rectTop: number, scrollY: number) =>
  rectTop + scrollY

export interface ScrollMotionState {
  position: number
  velocity: number
}

/** Overdamped motion follows a changing target without passing through it. */
export const advanceScrollTowardTarget = (
  state: ScrollMotionState,
  target: number,
  elapsedFrames: number,
): ScrollMotionState => {
  const dt = Math.min(2, Math.max(0, elapsedFrames))
  const remaining = target - state.position
  if (Math.abs(remaining) < 0.001) return { position: target, velocity: 0 }

  // If layout moves the target behind us, discard momentum in the old direction.
  const momentum = state.velocity * remaining < 0 ? 0 : state.velocity
  const velocity = (momentum + remaining * 0.08 * dt) * Math.pow(0.5, dt)
  const position = state.position + velocity * dt

  if (remaining * (target - position) < 0) {
    return { position: target, velocity: 0 }
  }
  return { position, velocity }
}
