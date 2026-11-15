'use client'

import { createContext, useContext } from 'react'

import type { IHeaderMenu } from '../config'

export type NavPreviewKind = 'post' | 'note' | 'timeline'

export type NavPreviewApi = {
  show: (
    kind: NavPreviewKind,
    section: IHeaderMenu,
    anchor: HTMLElement,
  ) => void
  scheduleClose: () => void
  cancelClose: () => void
  close: () => void
}

export const NavPreviewContext = createContext<NavPreviewApi | null>(null)

export const useNavPreview = () => useContext(NavPreviewContext)

export const previewKindFor = (section: IHeaderMenu): NavPreviewKind | null => {
  if (section.type === 'Post') return 'post'
  if (section.type === 'Note') return 'note'
  if (section.path === '/timeline') return 'timeline'
  return null
}
