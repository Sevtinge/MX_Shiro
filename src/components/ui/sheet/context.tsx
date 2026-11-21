import { createContext, useContext } from 'react'

interface SheetContextValue {
  dismiss(): void
  isOpen: boolean
  touchFriendly: boolean
}
export const SheetContext = createContext<SheetContextValue>(null!)

export const useSheetContext = () => useContext(SheetContext)
