export const defaultLinkSections: LinkSection[] = [
  {
    name: '关于',
    links: [
      {
        name: '关于本站',
        href: '/about-site',
      },
      {
        name: '关于我',
        href: '/about-me',
      },
      {
        name: '关于此项目',
        href: 'https://github.com/innei/Shiro',
        external: true,
      },
    ],
  },
  {
    name: '更多',
    links: [
      {
        name: '时间线',
        href: '/timeline',
      },
      {
        name: '友链',
        href: '/friends',
      },
      {
        name: '捐赠',
        href: '/donation',
      },
      {
        name: '监控',
        href: 'https://status.shizuri.net/status/main',
        external: true,
      },
    ],
  },
  {
    name: '联系',
    links: [
      {
        name: '写留言',
        href: '/message',
      },
      {
        name: '发邮件',
        href: 'mailto:i@innei.in',
        external: true,
      },
      {
        name: 'GitHub',
        href: 'https://github.com/innei',
        external: true,
      },
    ],
  },
]

export interface FooterConfig {
  linkSections: LinkSection[]
  otherInfo: OtherInfo
}

export const donationFooterLink = {
  name: '捐赠',
  href: '/donation',
}

export function withDonationLink(sections: LinkSection[] = []): LinkSection[] {
  let inserted = false

  const next = sections.map((section) => {
    if (
      section.links.some(
        (link) => link.href === '/donation' || link.name === '捐赠',
      )
    ) {
      inserted = true
      return section
    }

    if (section.name !== '更多') return section

    const links = [...section.links]
    const friendIndex = links.findIndex(
      (link) => link.name === '友链' || link.href === '/friends',
    )
    links.splice(
      friendIndex >= 0 ? friendIndex + 1 : links.length,
      0,
      donationFooterLink,
    )
    inserted = true
    return { ...section, links }
  })

  if (inserted) return next

  return [
    ...next,
    {
      name: '更多',
      links: [donationFooterLink],
    },
  ]
}
