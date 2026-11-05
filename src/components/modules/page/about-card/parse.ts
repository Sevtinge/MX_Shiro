import type {
  AboutCardData,
  AboutDevice,
  AboutFact,
  AboutIdentity,
  AboutLink,
  AboutQuote,
  AboutSection,
  AboutSectionLayout,
  AboutSkillGroup,
} from './types'

const SAFE_URL = /^(?:https?:|mailto:|tel:|\/)/i

export type { AboutCardData } from './types'

const safeUrl = (value?: string) => {
  const next = value?.trim()
  if (!next || !SAFE_URL.test(next)) return
  return next
}

const parseAttrs = (raw?: string) => {
  const attrs: Record<string, string> = {}
  if (!raw) return attrs
  const re = /([A-Z][\w-]*)\s*=\s*([^\s}]+)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(raw))) attrs[match[1]] = match[2]
  return attrs
}

const clamp = (value: string | undefined, fallback: number, max: number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(1, Math.round(n)))
}

type Item = {
  label: string
  href?: string
  parts: string[]
  details: string[]
}

const parseItemHead = (text: string): Item => {
  const link = /^\[([^\]]+)\]\(([^)]+)\)\s*(?:\|\s*(.*))?$/.exec(text)
  if (link) {
    const extra = link[3]?.trim()
    return {
      label: link[1].trim(),
      href: safeUrl(link[2].trim()),
      parts: extra ? [link[1].trim(), extra] : [link[1].trim()],
      details: [],
    }
  }
  const parts = text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  return { label: parts[0] || text, parts, details: [] }
}

const parseItems = (lines: string[]) => {
  const items: Item[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const item = /^-\s+(.*)$/.exec(line)
    if (item) {
      items.push(parseItemHead(item[1].trim()))
      continue
    }
    const current = items.at(-1)
    if (/^\s+\S/.test(line) && current) {
      current.details.push(line.trim())
    }
  }
  return items
}

const joinQuote = (rows: string[]) =>
  rows.reduce((acc, row) => {
    if (!acc) return row
    const needsSpace = /[A-Z0-9]$/i.test(acc) && /^[A-Z0-9“"'「]/i.test(row)
    return acc + (needsSpace ? ' ' : '') + row
  }, '')

const parseQuotes = (lines: string[]): AboutQuote[] => {
  const quotes: AboutQuote[] = []
  let buf: string[] = []
  const flush = () => {
    const rows = buf.map((line) => line.trim()).filter(Boolean)
    buf = []
    if (rows.length === 0) return
    const citeAt = rows.findIndex((line) => /^(?:[—–]|--|-)\s+\S/.test(line))
    if (citeAt > 0) {
      quotes.push({
        text: joinQuote(rows.slice(0, citeAt)),
        cite: rows[citeAt].replace(/^(?:[—–]|--|-)\s+/, '').trim(),
      })
      return
    }
    quotes.push({ text: joinQuote(rows) })
  }
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('>')) {
      buf.push(trimmed.replace(/^>\s?/, ''))
      continue
    }
    if (!trimmed) flush()
  }
  flush()
  return quotes.filter((quote) => quote.text)
}

const percent = (value: string) => {
  const n = Number(value.replace('%', '').trim())
  if (!Number.isFinite(n)) return null
  return Math.min(100, Math.max(0, Math.round(n)))
}

const isSkillItem = (item: Item) => {
  const raw = item.parts.at(-1) || ''
  return item.parts.length >= 2 && percent(raw) !== null && !item.href
}

const markdownLink = (value: string) => {
  const match = /^\[([^\]]+)\]\((.+)\)$/.exec(value.trim())
  if (!match) return { text: value.trim() }
  const href = safeUrl(match[2].trim())
  return href ? { text: match[1].trim(), href } : { text: match[1].trim() }
}

const isDeviceItem = (item: Item) =>
  !item.href &&
  item.details.length === 0 &&
  item.parts.length >= 2 &&
  !isSkillItem(item)

const defaultSpan = (layout: AboutSectionLayout) =>
  layout === 'skills' || layout === 'goals' ? 12 : 6

const parseFact = (item: Item): AboutFact | null => {
  if (item.parts.length >= 2) {
    return { label: item.parts[0], value: item.parts.slice(1).join(' | ') }
  }
  const colon = /^([^:：]{1,16})[:：]\s*(.+)$/.exec(item.label)
  if (colon) return { label: colon[1].trim(), value: colon[2].trim() }
  if (item.details[0]) return { label: item.label, value: item.details[0] }
  return null
}

const parseIdentity = (lines: string[]): AboutIdentity | undefined => {
  const fields: Record<string, string> = {}
  const facts: AboutFact[] = []
  let currentKey: string | null = null
  for (const line of lines) {
    if (!line.trim()) continue
    const fact = /^-\s+(.*)$/.exec(line.trim())
    if (fact) {
      currentKey = null
      const parsed = parseFact(parseItemHead(fact[1].trim()))
      if (parsed) facts.push(parsed)
      continue
    }
    if (/^\s+\S/.test(line) && currentKey) {
      fields[currentKey] = `${fields[currentKey]} ${line.trim()}`.trim()
      continue
    }
    const factItem = facts.at(-1)
    if (/^\s+\S/.test(line) && factItem && !currentKey) {
      factItem.value = `${factItem.value} ${line.trim()}`.trim()
      continue
    }
    const meta = /^([A-Z][\w-]*)\s*:\s*(.*)$/i.exec(line.trim())
    if (meta) {
      currentKey = meta[1]
      fields[currentKey] = meta[2].trim()
    }
  }
  const name = fields.name || fields.handle
  if (!name && facts.length === 0) return
  return {
    handle: fields.handle,
    name: name || '未命名',
    avatar: safeUrl(fields.avatar),
    bio: fields.bio,
    facts: facts.filter((fact) => fact.label && fact.value),
  }
}

const buildSection = (
  title: string,
  attrs: Record<string, string>,
  lines: string[],
): AboutSection => {
  const preface: string[] = []
  let bodyStart = 0
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ') || trimmed.startsWith('####')) {
      bodyStart = i
      break
    }
    preface.push(trimmed)
    bodyStart = i + 1
  }
  const body = lines.slice(bodyStart)
  const groups: AboutSkillGroup[] = []
  let current: AboutSkillGroup | null = null
  const loose: string[] = []
  for (const line of body) {
    const heading = /^####\s+(.+?)\s*$/.exec(line.trim())
    if (heading) {
      current = { title: heading[1].trim(), skills: [] }
      groups.push(current)
      continue
    }
    if (current) {
      const item = /^-\s+(.*)$/.exec(line.trim())
      if (!item) continue
      const parsed = parseItemHead(item[1].trim())
      const value = percent(parsed.parts.at(-1) || '')
      if (value === null) continue
      current.skills.push({ name: parsed.parts[0] || parsed.label, value })
      continue
    }
    loose.push(line)
  }
  const items = parseItems(loose)
  let layout = attrs.layout as AboutSectionLayout | undefined
  if (
    layout !== 'links' &&
    layout !== 'devices' &&
    layout !== 'skills' &&
    layout !== 'goals'
  ) {
    layout = undefined
  }
  if (!layout) {
    if (groups.length > 0) layout = 'skills'
    else if (items.length > 0 && items.every(isDeviceItem)) layout = 'devices'
    else if (items.length > 0 && items.every(isSkillItem)) layout = 'skills'
    else if (
      items.length > 0 &&
      items.every(
        (item) =>
          !item.href && item.details.length === 0 && item.parts.length === 1,
      )
    )
      layout = 'goals'
    else layout = 'links'
  }
  const skillGroups =
    groups.length > 0
      ? groups
      : layout === 'skills'
        ? [
            {
              title: '',
              skills: items.flatMap((item) => {
                const value = percent(item.parts.at(-1) || '')
                if (value === null) return []
                return [{ name: item.parts[0] || item.label, value }]
              }),
            },
          ]
        : []
  return {
    title,
    subtitle: preface.join(' ') || undefined,
    icon: attrs.icon,
    span: clamp(attrs.span, defaultSpan(layout), 12),
    columns: clamp(
      attrs.columns,
      layout === 'devices' || (layout === 'links' && items.length > 4) ? 2 : 1,
      4,
    ),
    layout,
    links:
      layout === 'links'
        ? items.map(
            (item): AboutLink => ({
              label: item.label,
              href: item.href,
              detail:
                item.details[0] ||
                (item.parts.length > 1
                  ? item.parts.slice(1).join(' | ')
                  : undefined),
            }),
          )
        : [],
    devices:
      layout === 'devices'
        ? items.map((item): AboutDevice => {
            const hasIcon = item.parts.length >= 2
            const label = markdownLink(hasIcon ? item.parts[1] : item.label)
            const detail = markdownLink(
              item.parts.length >= 3
                ? item.parts.slice(2).join(' | ')
                : item.details[0] || '',
            )
            return {
              icon: hasIcon ? item.parts[0] : attrs.icon,
              label: label.text,
              detail: detail.text || undefined,
              href: detail.href || label.href,
            }
          })
        : [],
    groups: skillGroups.filter(
      (group) => group.skills.length > 0 || group.title,
    ),
    goals:
      layout === 'goals'
        ? items.map((item) =>
            [item.label, ...item.details].filter(Boolean).join(' '),
          )
        : [],
  }
}

type Block = {
  level: number
  title: string
  attrs: Record<string, string>
  lines: string[]
}

const parseBlocks = (inner: string) => {
  const blocks: Block[] = []
  let current: Block | null = null
  for (const line of inner.replaceAll('\r\n', '\n').split('\n')) {
    const heading = /^(#{1,4})\s+(.+?)\s*$/.exec(line.trim())
    if (heading && heading[1].length < 4) {
      const attrsMatch = /^(.*?)(?:\s+\{([^}]*)\})?\s*$/.exec(heading[2])
      current = {
        level: heading[1].length,
        title: (attrsMatch?.[1] || heading[2]).trim(),
        attrs: parseAttrs(attrsMatch?.[2]),
        lines: [],
      }
      blocks.push(current)
      continue
    }
    if (current) current.lines.push(line)
  }
  return blocks
}

const sectionHasContent = (section: AboutSection) => {
  if (section.layout === 'links') return section.links.length > 0
  if (section.layout === 'devices') return section.devices.length > 0
  if (section.layout === 'skills')
    return section.groups.some((group) => group.skills.length)
  return section.goals.length > 0
}

export function parseAboutInner(inner: string): AboutCardData | null {
  const blocks = parseBlocks(inner)
  const station = blocks.find((block) => block.level === 2)
  const identityBlock = blocks.find(
    (block) => block.level === 3 && block.title.toLowerCase() === 'identity',
  )
  const quotesBlock = blocks.find(
    (block) => block.level === 3 && block.title.toLowerCase() === 'quotes',
  )
  const sections = blocks
    .filter(
      (block) =>
        block.level === 3 && block !== identityBlock && block !== quotesBlock,
    )
    .map((block) => buildSection(block.title, block.attrs, block.lines))
    .filter(sectionHasContent)
  const identity = identityBlock
    ? parseIdentity(identityBlock.lines)
    : undefined
  const quotes = quotesBlock ? parseQuotes(quotesBlock.lines) : []
  if (!station && !identity && quotes.length === 0 && sections.length === 0)
    return null
  return {
    sectionTitle: station?.title,
    sectionEyebrow: station?.lines.map((line) => line.trim()).find(Boolean),
    identity,
    quotes,
    sections,
  }
}

export function parseAboutPage(markdown?: string | null) {
  const source = (markdown || '').replaceAll('\r\n', '\n')
  if (!/^\s*::: about\b/.test(source)) return null
  const match =
    /^\s*::: about(?:[ \t]+\{[^}]*\})?[ \t]*\n([\s\S]*?)\n[ \t]*:::[ \t]*$/m.exec(
      source,
    )
  if (!match || match.index === undefined) return null
  const data = parseAboutInner(match[1])
  if (!data) return null
  const rest =
    `${source.slice(0, match.index)}${source.slice(match.index + match[0].length)}`.trim()
  return { data, rest }
}
