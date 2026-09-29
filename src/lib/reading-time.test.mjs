import assert from 'node:assert/strict'
import { test } from 'node:test'

import { estimateReadingMinutes } from './reading-time.ts'

test('shows at least one minute for an empty or short article', () => {
  assert.equal(estimateReadingMinutes(''), 1)
  assert.equal(estimateReadingMinutes('短文。'), 1)
})

test('counts Chinese characters and English words at separate rates', () => {
  assert.equal(estimateReadingMinutes('中'.repeat(350)), 1)
  assert.equal(estimateReadingMinutes('中'.repeat(351)), 2)
  assert.equal(estimateReadingMinutes('word '.repeat(220)), 1)
  assert.equal(estimateReadingMinutes('word '.repeat(221)), 2)
  assert.equal(
    estimateReadingMinutes(`${'中'.repeat(175)}${'word '.repeat(110)}`),
    1,
  )
})

test('counts fenced code without also counting its tokens as prose', () => {
  assert.equal(
    estimateReadingMinutes(`\`\`\`js\n${'x'.repeat(700)}\n\`\`\``),
    1,
  )
  assert.equal(
    estimateReadingMinutes(`\`\`\`js\n${'x'.repeat(701)}\n\`\`\``),
    2,
  )
  assert.equal(
    estimateReadingMinutes(
      ['普通文字', '~~~ts', 'x'.repeat(700), '~~~'].join('\n'),
    ),
    2,
  )
})

test('ignores markdown syntax and links in the word estimate', () => {
  assert.equal(
    estimateReadingMinutes('[link](https://example.com) **bold**'),
    1,
  )
})
