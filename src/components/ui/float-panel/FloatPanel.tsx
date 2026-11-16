import type { Placement, Strategy } from '@floating-ui/react-dom'
import { flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { AnimatePresence, m } from 'motion/react'
import type { FC, PropsWithChildren } from 'react'
import { cloneElement, useEffect, useMemo, useRef, useState } from 'react'

import { clsxm } from '~/lib/helper'

import { RootPortal } from '../portal'

interface FloatPanelProps {
  triggerElement: Parameters<typeof cloneElement>[0]
  strategy?: Strategy
  placement?: Placement
}

export const FloatPanel: FC<FloatPanelProps & PropsWithChildren> = (props) => {
  const {
    triggerElement,
    strategy = 'fixed',
    placement = 'right',
    children,
  } = props

  const [panelOpen, setPanelOpen] = useState(false)

  const { isPositioned, refs, x, y, elements } = useFloating({
    strategy,
    placement,
    middleware: [flip({ padding: 20 }), offset(10), shift()],
  })

  const floatingRef = useRef<HTMLElement>()
  floatingRef.current = elements.floating || undefined
  // @ts-ignore
  // useClickAway(floatingRef, (e) => {

  //   setPanelOpen(false)
  // })

  useEffect(() => {
    if (!panelOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (elements.floating?.contains(target)) return
      if (elements.reference instanceof Node && elements.reference.contains(target)) return
      if (
        target instanceof Element &&
        target.closest('[data-radix-popper-content-wrapper], [role="listbox"]')
      ) {
        return
      }
      setPanelOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [elements.floating, elements.reference, panelOpen])

  return (
    <>
      {useMemo(
        () =>
          cloneElement(triggerElement, {
            // @ts-ignore
            ref: refs.setReference,
            onClick: () => {
              setPanelOpen((v) => !v)
            },
          }),
        [refs.setReference, triggerElement],
      )}

      <RootPortal>
        <AnimatePresence>
          {panelOpen && (
            <m.div
              initial={{ opacity: 0.02, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.02, y: 10 }}
              className={clsxm(
                'relative z-[99] overflow-hidden rounded-2xl p-4 outline-none',
                'bg-gradient-to-b from-zinc-50/95 to-white/95 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md',
                'dark:from-zinc-900/95 dark:to-zinc-800/95 dark:shadow-zinc-950/30 dark:ring-zinc-100/10',
              )}
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? '',
                left: x ?? '',
                visibility: isPositioned && x !== null ? 'visible' : 'hidden',
              }}
            >
              {children}
            </m.div>
          )}
        </AnimatePresence>
      </RootPortal>
    </>
  )
}
