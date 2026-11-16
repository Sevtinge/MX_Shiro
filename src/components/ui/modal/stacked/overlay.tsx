import { m } from 'motion/react'

import { RootPortal } from '../../portal'

export const ModalOverlay = ({
  zIndex,
  onClick,
}: {
  zIndex?: number
  onClick?: () => void
}) => (
  <RootPortal>
    <m.div
      id="modal-overlay"
      className="fixed inset-0 z-[11] bg-zinc-950/20 backdrop-blur-[2px] dark:bg-black/45"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex }}
      onClick={onClick}
    />
  </RootPortal>
)
