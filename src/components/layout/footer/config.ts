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
  {
    name: '法律',
    links: [
      {
        name: '用户协议',
        href: '/term-of-service',
      },
      {
        name: '隐私政策',
        href: '/privacy-policy',
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
      friendIndex !== -1 ? friendIndex + 1 : links.length,
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

export const aboutSiteFooterLink = {
  name: '关于本站',
  href: '/about-site',
}

export function withAboutSiteLink(sections: LinkSection[] = []): LinkSection[] {
  let inserted = false

  const next = sections.map((section) => {
    if (
      section.links.some(
        (link) => link.href === '/about-site' || link.name === '关于本站',
      )
    ) {
      inserted = true
      return section
    }

    if (section.name !== '关于') return section

    const links = [...section.links]
    const aboutMeIndex = links.findIndex(
      (link) => link.name === '关于我' || link.href === '/about-me',
    )
    links.splice(
      aboutMeIndex !== -1 ? aboutMeIndex + 1 : links.length,
      0,
      aboutSiteFooterLink,
    )
    inserted = true
    return { ...section, links }
  })

  if (inserted) return next

  return [
    {
      name: '关于',
      links: [aboutSiteFooterLink],
    },
    ...next,
  ]
}

export const legalFooterLinks = [
  {
    name: '用户协议',
    href: '/term-of-service',
  },
  {
    name: '隐私政策',
    href: '/privacy-policy',
  },
]

export function withLegalSection(sections: LinkSection[] = []): LinkSection[] {
  const existing = sections.find((section) => section.name === '法律')
  if (existing) {
    return sections.map((section) => {
      if (section.name !== '法律') return section
      const links = [...section.links]
      for (const link of legalFooterLinks) {
        if (
          links.some(
            (item) => item.href === link.href || item.name === link.name,
          )
        ) {
          continue
        }
        links.push(link)
      }
      return { ...section, links }
    })
  }

  const contactIndex = sections.findIndex((section) => section.name === '联系')
  const next = [...sections]
  next.splice(contactIndex === -1 ? next.length : contactIndex + 1, 0, {
    name: '法律',
    links: legalFooterLinks,
  })
  return next
}
