import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getAiParticipationLabels } from './ai-participation.ts'

test('renders every selected built-in AI participation tag', () => {
  assert.deepEqual(getAiParticipationLabels([0, 5]), ['辅助写作', '校对'])
  assert.deepEqual(getAiParticipationLabels([-1]), ['无 AI (手作)'])
  assert.deepEqual(getAiParticipationLabels([2, 8, 9]), [
    '完全 AI 生成',
    'AI 作图',
    '口述',
  ])
})

test('preserves custom options and older text declarations', () => {
  assert.deepEqual(getAiParticipationLabels([0, '自定义项目']), [
    '辅助写作',
    '自定义项目',
  ])
  assert.deepEqual(getAiParticipationLabels(' AI 辅助整理 '), ['AI 辅助整理'])
  assert.deepEqual(getAiParticipationLabels(true), [
    '本文创作过程中使用了 AI 辅助。',
  ])
})

test('does not discard future numeric options or show empty values', () => {
  assert.deepEqual(getAiParticipationLabels([42]), ['42'])
  assert.deepEqual(getAiParticipationLabels([null, '', false]), [])
  assert.deepEqual(getAiParticipationLabels(false), [])
  assert.deepEqual(getAiParticipationLabels(undefined), [])
})
