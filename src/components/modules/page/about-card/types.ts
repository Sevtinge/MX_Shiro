export type AboutFact = { label: string; value: string }

export type AboutQuote = { text: string; cite?: string }

export type AboutLink = { label: string; detail?: string; href?: string }

export type AboutDevice = {
  icon?: string
  label: string
  detail?: string
  href?: string
}

export type AboutSkill = { name: string; value: number }

export type AboutSkillGroup = { title: string; skills: AboutSkill[] }

export type AboutSectionLayout = 'links' | 'devices' | 'skills' | 'goals'

export type AboutSection = {
  title: string
  subtitle?: string
  icon?: string
  span: number
  columns: number
  layout: AboutSectionLayout
  links: AboutLink[]
  devices: AboutDevice[]
  groups: AboutSkillGroup[]
  goals: string[]
}

export type AboutIdentity = {
  handle?: string
  name: string
  avatar?: string
  bio?: string
  facts: AboutFact[]
}

export type AboutCardData = {
  sectionTitle?: string
  sectionEyebrow?: string
  identity?: AboutIdentity
  quotes: AboutQuote[]
  sections: AboutSection[]
}
