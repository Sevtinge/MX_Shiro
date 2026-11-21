import type { FC, PropsWithChildren, ReactNode } from 'react'

import type { PresentSheetProps } from '../../sheet'
import type { ModalContentPropsInternal } from './context'

export interface ModalProps {
  title: ReactNode
  CustomModalComponent?: FC<PropsWithChildren>
  content: FC<ModalContentPropsInternal>
  clickOutsideToDismiss?: boolean
  modalClassName?: string
  modalContainerClassName?: string
  modalBodyClassName?: string
  modalHeaderClassName?: string
  modalDividerClassName?: string
  sheet?: Pick<PresentSheetProps, 'touchFriendly'>

  max?: boolean

  wrapper?: FC

  overlay?: boolean
}
