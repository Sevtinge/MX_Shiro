import assert from 'node:assert/strict'
import { test } from 'node:test'

import { advanceGlowSpring, clampGlow } from './hero-glow-physics.ts'

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
