const ICONS: Record<string, string> = {
  wand: 'i-mingcute-magic-2-line',
  at: 'i-mingcute-at-line',
  game: 'i-mingcute-game-2-line',
  device: 'i-mingcute-device-line',
  laptop: 'i-mingcute-laptop-line',
  phone: 'i-mingcute-cellphone-line',
  tablet: 'i-mingcute-pad-line',
  watch: 'i-mingcute-watch-line',
  headphone: 'i-mingcute-headphone-line',
  camera: 'i-mingcute-camera-2-line',
  lens: 'i-mingcute-microscope-line',
  heart: 'i-mingcute-heart-line',
  flag: 'i-mingcute-flag-1-line',
  quote: 'i-mingcute-quote-left-line',
  link: 'i-mingcute-link-line',
  palette: 'i-mingcute-palette-line',
  star: 'i-mingcute-star-line',
  mail: 'i-mingcute-mail-line',
  user: 'i-mingcute-user-3-line',
  arrow: 'i-mingcute-arrow-right-up-line',
}

export const iconClass = (name?: string, fallback = 'link') => {
  if (!name) return ICONS[fallback]
  if (/^i-(?:mingcute|material-symbols)-[\w-]+$/.test(name)) return name
  return ICONS[name] || ICONS[fallback]
}

export const iconForSection = (
  title: string,
  icon: string | undefined,
  layout: string,
) => {
  if (icon) return iconClass(icon, layout === 'goals' ? 'flag' : 'link')
  if (/设定|起源|关于/.test(title)) return ICONS.wand
  if (/社交|联系|链接/.test(title)) return ICONS.at
  if (/游戏/.test(title)) return ICONS.game
  if (/设备/.test(title)) return ICONS.device
  if (/爱好|技能|兴趣/.test(title)) return ICONS.heart
  if (/接下来|目标|计划/.test(title)) return ICONS.flag
  if (layout === 'devices') return ICONS.device
  if (layout === 'skills') return ICONS.heart
  if (layout === 'goals') return ICONS.flag
  return ICONS.link
}
