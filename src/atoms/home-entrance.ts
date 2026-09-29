import { atom, useAtomValue } from 'jotai'

import { jotaiStore } from '~/lib/store'

const skipHomeEntranceAtom = atom(false)

export const useSkipHomeEntrance = () => useAtomValue(skipHomeEntranceAtom)

export const skipHomeEntranceFromHeader = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    jotaiStore.set(skipHomeEntranceAtom, true)
  }
}

export const resetHomeEntrance = () =>
  jotaiStore.set(skipHomeEntranceAtom, false)
