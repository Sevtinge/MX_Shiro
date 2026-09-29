/** Built-in Mix Space AI participation options. Keep custom text intact. */
const AI_PARTICIPATION_LABELS: Record<number, string> = {
  [-1]: '无 AI (手作)',
  0: '辅助写作',
  1: '润色',
  2: '完全 AI 生成',
  3: '故事整理',
  4: '标题生成',
  5: '校对',
  6: '灵感提供',
  7: '改写',
  8: 'AI 作图',
  9: '口述',
}

export const getAiParticipationLabels = (value: unknown): string[] => {
  const entries = Array.isArray(value) ? value : [value]
  return entries.flatMap((entry) => {
    if (typeof entry === 'number') {
      return [AI_PARTICIPATION_LABELS[entry] ?? String(entry)]
    }
    if (typeof entry === 'string') {
      const label = entry.trim()
      return label ? [label] : []
    }
    return entry === true ? ['本文创作过程中使用了 AI 辅助。'] : []
  })
}
