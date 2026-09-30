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

/** Use the visible viewport, not document height; cap very small and huge screens. */
export const getGlowMotionScale = (width: number, height: number) =>
  clampGlow(
    Math.sqrt((Math.max(0, width) * Math.max(0, height)) / (1280 * 720)),
    0.5,
    1.6,
  )

const AMBIENT_MOTION_GAIN = 1.15
const AMBIENT_DRIFT_SPEED = 1.25
const AMBIENT_BREATHING_SPEED = 1.15

/** Independent slow paths keep the two lights alive without moving in lockstep. */
export const getGlowDrift = (seconds: number, motionScale = 1) => {
  const time = seconds * AMBIENT_DRIFT_SPEED
  const amplitude = motionScale * AMBIENT_MOTION_GAIN
  return {
    near: {
      x: (Math.sin(time * 0.28) * 70 + Math.sin(time * 0.43) * 12) * amplitude,
      y: Math.sin(time * 0.24) * 50 * amplitude,
    },
    far: {
      x: (-Math.sin(time * 0.29) * 56 + Math.sin(time * 0.39) * 9) * amplitude,
      y: -Math.sin(time * 0.31) * 42 * amplitude,
    },
  }
}

/** More travel and a longer braking tail, rather than a bouncy spring. */
export const addGlowScrollImpulse = (impulse: number, scrollDelta: number) =>
  clampGlow(impulse - scrollDelta * 1.35, -285, 285)

export const decayGlowScrollImpulse = (
  impulse: number,
  elapsedFrames: number,
) => impulse * Math.pow(0.97, clampGlow(elapsedFrames, 0, 2))

/** Gentle breathing uses separate rhythms and starts at the original size. */
export const getGlowBreathing = (seconds: number, motionScale = 1) => {
  const time = seconds * AMBIENT_BREATHING_SPEED
  const amplitude = motionScale * AMBIENT_MOTION_GAIN
  return {
    near: 1 + Math.sin(time * 0.42) * 0.06 * amplitude,
    far: 1 + Math.sin(time * 0.35) * 0.08 * amplitude,
  }
}
