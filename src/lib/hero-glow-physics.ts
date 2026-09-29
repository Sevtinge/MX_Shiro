export interface GlowSpring {
  position: number
  velocity: number
}

export const clampGlow = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

// An overdamped spring retains momentum without the rubber-band rebound.
// Delta is measured in 60 Hz frames and capped after background-tab pauses.
export const advanceGlowSpring = (
  spring: GlowSpring,
  target: number,
  elapsedFrames: number,
): GlowSpring => {
  const dt = clampGlow(elapsedFrames, 0, 2)
  const velocity =
    (spring.velocity + (target - spring.position) * 0.02 * dt) *
    Math.pow(0.75, dt)

  return {
    position: spring.position + velocity * dt,
    velocity,
  }
}
