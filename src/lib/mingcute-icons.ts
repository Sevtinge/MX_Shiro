import 'server-only'

import { icons as mingcute } from '@iconify-json/mingcute'

import {
  iconClass,
  iconForSection,
  isBundledIcon,
} from '~/components/modules/page/about-card/icons'
import { parseAboutInner } from '~/components/modules/page/about-card/parse'

type IconData = { body: string; width?: number; height?: number }

const resolveIcon = (
  name: string,
  seen = new Set<string>(),
): IconData | null => {
  if (seen.has(name)) return null
  seen.add(name)
  const direct = mingcute.icons[name]
  if (direct?.body) return direct
  const parent = mingcute.aliases?.[name]?.parent
  if (!parent) return null
  return resolveIcon(parent, seen)
}

const svgUrl = (icon: IconData) => {
  const width = icon.width || mingcute.width || 24
  const height = icon.height || mingcute.height || 24
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const ruleFor = (className: string) => {
  if (isBundledIcon(className)) return ''
  const name = /^i-mingcute-([a-z0-9-]+)$/.exec(className)?.[1]
  if (!name) return ''
  const icon = resolveIcon(name)
  if (!icon) return ''
  const url = svgUrl(icon)
  return `.${className}{display:inline-block;width:1em;height:1em;background-color:currentColor;-webkit-mask-image:url("${url}");mask-image:url("${url}");-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:100% 100%;mask-size:100% 100%;}`
}

const collectClasses = (markdown?: string | null) => {
  const source = (markdown || '').replaceAll('\r\n', '\n')
  const classes = new Set<string>()
  const blocks = source.matchAll(/::: about\b[^\n]*\n([\s\S]*?)\n[ \t]*:::/g)
  for (const block of blocks) {
    const data = parseAboutInner(block[1])
    if (!data) continue
    for (const section of data.sections) {
      classes.add(iconForSection(section.title, section.icon, section.layout))
      for (const device of section.devices) {
        classes.add(iconClass(device.icon, 'device'))
      }
    }
  }
  return classes
}

export const mingcuteIconCss = (markdown?: string | null) =>
  [...collectClasses(markdown)].map(ruleFor).filter(Boolean).join('')
