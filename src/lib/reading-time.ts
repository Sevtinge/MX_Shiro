import RemoveMarkdown from 'remove-markdown'

/** A rough reading time for mixed Chinese/English posts and fenced code. */
export const estimateReadingMinutes = (markdown: string) => {
  let codeCharacters = 0
  const proseMarkdown = markdown.replaceAll(
    /```[^\n]*\n[\s\S]*?```|~~~[^\n]*\n[\s\S]*?~~~/g,
    (block) => {
      const code = block
        .replace(/^(?:```|~~~)[^\n]*\n/, '')
        .replace(/(?:```|~~~)$/, '')
      codeCharacters += code.replaceAll(/\s/g, '').length
      return ' '
    },
  )
  const prose = RemoveMarkdown(proseMarkdown)
  const chineseCharacters = (prose.match(/[\u3400-\u9fff]/g) || []).length
  const latinWords = (prose.match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/gi) || [])
    .length

  return Math.max(
    1,
    Math.ceil(
      chineseCharacters / 350 + latinWords / 220 + codeCharacters / 700,
    ),
  )
}
