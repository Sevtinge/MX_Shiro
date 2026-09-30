import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  addGlowScrollImpulse,
  advanceGlowSpring,
  clampGlow,
  decayGlowScrollImpulse,
  getGlowBreathing,
  getGlowDrift,
  getGlowMotionScale,
} from './hero-glow-physics.ts'

test('spring stays at rest without movement', () => {
  assert.deepEqual(advanceGlowSpring({ position: 0, velocity: 0 }, 0, 1), {
    position: 0,
    velocity: 0,
  })
})

test('light keeps moving briefly after a drag stops, then settles', () => {
  let spring = { position: 0, velocity: 0 }
  for (let i = 0; i < 6; i++) spring = advanceGlowSpring(spring, 60, 1)
  const positionAtRelease = spring.position
  spring = advanceGlowSpring(spring, 0, 1)

  assert.ok(spring.position > positionAtRelease)
  for (let i = 0; i < 160; i++) spring = advanceGlowSpring(spring, 0, 1)
  assert.ok(Math.abs(spring.position) < 0.1)
  assert.ok(Math.abs(spring.velocity) < 0.1)
})

test('bounded frame time prevents a large background-tab jump', () => {
  const spring = { position: 12, velocity: 4 }
  assert.deepEqual(
    advanceGlowSpring(spring, -30, 1000),
    advanceGlowSpring(spring, -30, 2),
  )
})

test('scroll and pointer targets stay within the intended limits', () => {
  assert.equal(clampGlow(240, -190, 190), 190)
  assert.equal(clampGlow(-240, -190, 190), -190)
  assert.equal(clampGlow(25, -190, 190), 25)
})

test('heavy light does not bounce across its resting position', () => {
  let spring = { position: 0, velocity: 0 }
  for (let i = 0; i < 24; i++) spring = advanceGlowSpring(spring, 70, 1)
  for (let i = 0; i < 220; i++) {
    spring = advanceGlowSpring(spring, 0, 1)
    assert.ok(spring.position >= -0.01)
  }
  assert.ok(Math.abs(spring.position) < 0.1)
})

test('pointer movement becomes visibly noticeable within a short drag', () => {
  let spring = { position: 0, velocity: 0 }
  for (let i = 0; i < 12; i++) spring = advanceGlowSpring(spring, 160, 1)
  assert.ok(spring.position > 60)
})

test('ambient drift starts smoothly and stays small over its full paths', () => {
  const start = getGlowDrift(0)
  for (const light of [start.near, start.far]) {
    assert.equal(Math.abs(light.x), 0)
    assert.equal(Math.abs(light.y), 0)
  }
  for (let time = 0; time < 180; time += 0.1) {
    const drift = getGlowDrift(time)
    assert.ok(Math.abs(drift.near.x) <= 82 * 1.15)
    assert.ok(Math.abs(drift.near.y) <= 50 * 1.15)
    assert.ok(Math.abs(drift.far.x) <= 65 * 1.15)
    assert.ok(Math.abs(drift.far.y) <= 42 * 1.15)
    const next = getGlowDrift(time + 1 / 60)
    assert.ok(Math.abs(next.near.x - drift.near.x) < 0.65)
    assert.ok(Math.abs(next.far.y - drift.far.y) < 0.34)
  }
  const moving = getGlowDrift(6)
  assert.notEqual(moving.near.x, moving.far.x)
  assert.notEqual(moving.near.y, moving.far.y)
})

test('scroll impulse has stronger but bounded travel and a smooth braking tail', () => {
  assert.equal(addGlowScrollImpulse(0, 100), -135)
  assert.equal(addGlowScrollImpulse(0, -100), 135)
  assert.equal(addGlowScrollImpulse(0, 1000), -285)
  assert.equal(addGlowScrollImpulse(0, -1000), 285)
  const impulse = decayGlowScrollImpulse(-135, 1)
  assert.ok(impulse < -128.25) // More energy retained than the previous 0.95 decay.
  assert.equal(
    decayGlowScrollImpulse(-135, 1000),
    decayGlowScrollImpulse(-135, 2),
  )
})

test('scroll release continues traveling before settling without repeated rebounds', () => {
  let impulse = 0
  let spring = { position: 0, velocity: 0 }
  for (let frame = 0; frame < 8; frame++) {
    impulse = decayGlowScrollImpulse(addGlowScrollImpulse(impulse, 22), 1)
    spring = advanceGlowSpring(spring, impulse, 1)
  }
  const release = spring.position
  for (let frame = 0; frame < 8; frame++) {
    impulse = decayGlowScrollImpulse(impulse, 1)
    spring = advanceGlowSpring(spring, impulse, 1)
  }
  assert.ok(spring.position < release - 20)
  for (let frame = 0; frame < 400; frame++) {
    impulse = decayGlowScrollImpulse(impulse, 1)
    spring = advanceGlowSpring(spring, impulse, 1)
    assert.ok(spring.position <= 0.01)
  }
  assert.ok(Math.abs(spring.position) < 0.1)
})

test('idle drift is noticeable within a few seconds without pointer input', () => {
  const drift = getGlowDrift(4)
  assert.ok(Math.hypot(drift.near.x, drift.near.y) > 65)
  assert.ok(Math.hypot(drift.far.x, drift.far.y) > 40)
})

test('breathing starts at the original size and stays gentle and continuous', () => {
  assert.deepEqual(getGlowBreathing(0), { near: 1, far: 1 })
  for (let time = 0; time < 180; time += 0.1) {
    const breathing = getGlowBreathing(time)
    assert.ok(
      breathing.near >= 1 - 0.06 * 1.15 && breathing.near <= 1 + 0.06 * 1.15,
    )
    assert.ok(
      breathing.far >= 1 - 0.08 * 1.15 && breathing.far <= 1 + 0.08 * 1.15,
    )
    const next = getGlowBreathing(time + 1 / 60)
    assert.ok(Math.abs(next.near - breathing.near) < 0.001)
    assert.ok(Math.abs(next.far - breathing.far) < 0.001)
  }
  const breathing = getGlowBreathing(3)
  assert.ok(breathing.near > 1.03)
  assert.ok(breathing.far > 1.03)
  assert.notEqual(breathing.near, breathing.far)
})

test('motion amplitude follows viewport size with safe minimum and maximum', () => {
  assert.equal(getGlowMotionScale(1280, 720), 1)
  assert.equal(getGlowMotionScale(1920, 1080), 1.5)
  const phone = getGlowMotionScale(390, 844)
  assert.ok(phone >= 0.5 && phone < 1)
  assert.equal(getGlowMotionScale(7680, 4320), 1.6)
  assert.equal(getGlowMotionScale(0, 0), 0.5)
})

test('both drift and breathing grow with the viewport, not with page length', () => {
  const small = getGlowMotionScale(390, 844)
  const large = getGlowMotionScale(1920, 1080)
  const smallDrift = getGlowDrift(4, small)
  const largeDrift = getGlowDrift(4, large)
  for (const light of ['near', 'far']) {
    assert.ok(Math.abs(largeDrift[light].x) > Math.abs(smallDrift[light].x))
    assert.ok(Math.abs(largeDrift[light].y) > Math.abs(smallDrift[light].y))
    const smallBreath = getGlowBreathing(4, small)[light] - 1
    const largeBreath = getGlowBreathing(4, large)[light] - 1
    assert.ok(largeBreath > smallBreath)
  }
})

test('travel and breathing excursions are exactly 15 percent larger', () => {
  const time = 4
  const factor = getGlowMotionScale(1920, 1080)
  const drift = getGlowDrift(time, factor)
  const breathing = getGlowBreathing(time, factor)
  const previousX =
    (Math.sin(time * 1.25 * 0.28) * 70 + Math.sin(time * 1.25 * 0.43) * 12) *
    factor
  const previousNearScale = Math.sin(time * 1.15 * 0.42) * 0.06 * factor
  const previousFarScale = Math.sin(time * 1.15 * 0.35) * 0.08 * factor
  assert.ok(Math.abs(drift.near.x / previousX - 1.15) < 1e-10)
  assert.ok(Math.abs((breathing.near - 1) / previousNearScale - 1.15) < 1e-10)
  assert.ok(Math.abs((breathing.far - 1) / previousFarScale - 1.15) < 1e-10)
})

test('drift runs 25 percent faster and breathing 15 percent faster without changing amplitudes', () => {
  for (const seconds of [1, 3, 7, 13]) {
    const driftTime = seconds * 1.25
    const breathingTime = seconds * 1.15
    const drift = getGlowDrift(seconds)
    const breathing = getGlowBreathing(seconds)
    const expectedDriftY = Math.sin(driftTime * 0.24) * 50 * 1.15
    const expectedNearBreathing =
      1 + Math.sin(breathingTime * 0.42) * 0.06 * 1.15
    const expectedFarBreathing =
      1 + Math.sin(breathingTime * 0.35) * 0.08 * 1.15
    assert.ok(Math.abs(drift.near.y - expectedDriftY) < 1e-10)
    assert.ok(Math.abs(breathing.near - expectedNearBreathing) < 1e-10)
    assert.ok(Math.abs(breathing.far - expectedFarBreathing) < 1e-10)
  }
})
