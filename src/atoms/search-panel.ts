import { atom } from 'jotai'

export const searchPanelOpenAtom = atom(false)
export const searchKeywordAtom = atom('')
export const searchPanelTransitioningAtom = atom(false)
export const searchPanelTriggerAtom = atom<HTMLButtonElement | null>(null)
