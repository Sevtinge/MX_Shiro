import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import { atom, useStore } from 'jotai'
import { m, useReducedMotion } from 'motion/react'
import type { FC, PropsWithChildren, ReactNode } from 'react'
import * as React from 'react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Drawer } from 'vaul'

import { useEventCallback } from '~/hooks/common/use-event-callback'
import { clsxm } from '~/lib/helper'

import { SheetContext } from './context'
import { sheetTransitionEase, useSheetTransition } from './use-sheet-transition'

export interface PresentSheetProps {
  content: ReactNode | FC
  open?: boolean
  onOpenChange?: (value: boolean) => void
  title?: ReactNode
  zIndex?: number
  dismissible?: boolean
  defaultOpen?: boolean

  triggerAsChild?: boolean
  modal?: boolean
  noBodyStyles?: boolean
  touchFriendly?: boolean
  stackDepth?: number
  covered?: boolean
  onAnimationEnd?: (open: boolean) => void
}

export const sheetStackAtom = atom([] as HTMLDivElement[])

export type SheetRef = {
  dismiss: () => void
}

export const PresentSheet = forwardRef<
  SheetRef,
  PropsWithChildren<PresentSheetProps>
>((props, ref) => {
  const {
    content,
    children,
    zIndex = 998,
    title,
    dismissible = true,
    defaultOpen,
    triggerAsChild,
    modal = true,
    noBodyStyles = false,
    touchFriendly = false,
    stackDepth = 0,
    covered = false,
    onOpenChange,
  } = props

  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const isOpen = props.open ?? internalOpen
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const transition = useSheetTransition(
    isOpen,
    reducedMotion,
    props.onAnimationEnd,
  )
  const changeOpen = useEventCallback((open: boolean) => {
    setInternalOpen(open)
    onOpenChange?.(open)
  })

  useImperativeHandle(ref, () => ({
    dismiss: () => changeOpen(false),
  }))

  useIsomorphicLayoutEffect(() => {
    if (!transition.mounted) return
    // Vaul disables this transition while dragging; restore it before reversing.
    if (contentRef.current)
      contentRef.current.style.transition = `transform ${transition.duration}ms ${sheetTransitionEase}`
    if (!isOpen) document.body.style.pointerEvents = 'auto'
  }, [isOpen, transition.duration, transition.mounted])

  const contextValue = useMemo(
    () => ({
      dismiss: () => changeOpen(false),
      isOpen,
      touchFriendly,
    }),
    [isOpen, changeOpen, touchFriendly],
  )
  const [holderRef, setHolderRef] = useState<HTMLDivElement | null>()
  const store = useStore()

  useEffect(() => {
    const holder = holderRef
    if (!holder || !isOpen) return
    store.set(sheetStackAtom, (p) => {
      return p.concat(holder)
    })

    return () => {
      store.set(sheetStackAtom, (p) => {
        return p.filter((item) => item !== holder)
      })
    }
  }, [holderRef, isOpen, store])

  const { Root } = Drawer

  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  return (
    <Root
      dismissible={dismissible}
      modal={modal}
      noBodyStyles={noBodyStyles}
      handleOnly={touchFriendly}
      fixed={touchFriendly}
      autoFocus={touchFriendly}
      open={isOpen}
      onOpenChange={changeOpen}
    >
      {!!children && (
        <Drawer.Trigger asChild={triggerAsChild}>{children}</Drawer.Trigger>
      )}
      {transition.mounted && (
        <Drawer.Portal forceMount>
          <Drawer.Content
            forceMount
            ref={contentRef}
            aria-describedby={undefined}
            data-sheet-state={isOpen ? 'open' : 'closing'}
            onTransitionEnd={transition.onTransitionEnd}
            onPointerDownCapture={(event) => {
              if (!isOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            onClickCapture={(event) => {
              if (!isOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            onCloseAutoFocus={(event) => {
              const active = document.activeElement
              if (
                active instanceof HTMLElement &&
                active !== document.body &&
                !contentRef.current?.contains(active)
              )
                event.preventDefault()
            }}
            style={{
              zIndex: contentZIndex,
              animation: 'none',
              transform: transition.entered
                ? 'translate3d(0, 0, 0)'
                : 'translate3d(0, 100%, 0)',
              transition: `transform ${transition.duration}ms ${sheetTransitionEase}`,
              pointerEvents: covered ? 'none' : 'auto',
              ...(touchFriendly
                ? { height: `calc(88svh - ${Math.min(stackDepth, 3) * 24}px)` }
                : {}),
            }}
            className={clsxm(
              'fixed inset-x-0 bottom-0 flex flex-col outline-none',
              touchFriendly
                ? 'max-h-[calc(100dvh-1rem-env(safe-area-inset-top))]'
                : 'max-h-[calc(100svh-5rem)] rounded-t-[10px] bg-base-100 p-4',
            )}
          >
            <SheetContext.Provider value={contextValue}>
              <m.div
                data-sheet-surface
                initial={false}
                animate={{ scale: touchFriendly && covered ? 0.96 : 1 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.5,
                  ease: [0.32, 0.72, 0, 1],
                }}
                style={{ transformOrigin: 'top center' }}
                className={
                  touchFriendly
                    ? 'relative flex min-h-0 flex-1 flex-col rounded-t-3xl bg-base-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_48px_-12px_rgba(0,0,0,0.25)] ring-1 ring-zinc-900/5 dark:ring-white/10'
                    : 'contents'
                }
              >
                {dismissible && touchFriendly ? (
                  <div className="flex h-[36px] shrink-0 items-center justify-center">
                    <Drawer.Handle
                      preventCycle
                      aria-label="拖动关闭抽屉"
                      className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-neutral-700 [&_[data-vaul-handle-hitarea]]:h-[44px] [&_[data-vaul-handle-hitarea]]:w-[64px]"
                    />
                  </div>
                ) : (
                  dismissible && (
                    <div className="mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-neutral-800" />
                  )
                )}

                {touchFriendly ? (
                  <m.div
                    initial={reducedMotion ? false : { y: 30, opacity: 0 }}
                    animate={{ y: isOpen ? 0 : 16, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-3 grid min-h-[44px] shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2"
                  >
                    <span aria-hidden="true" />
                    <Drawer.Title className="min-w-0 truncate text-center text-base font-medium tracking-wide text-zinc-700 dark:text-zinc-200">
                      {title || '内容'}
                    </Drawer.Title>
                    {dismissible && (
                      <Drawer.Close asChild>
                        <button
                          type="button"
                          aria-label="关闭抽屉"
                          className="flex size-[44px] shrink-0 touch-manipulation items-center justify-center rounded-full bg-zinc-900/[0.04] text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-zinc-900/10 dark:bg-white/5 dark:text-zinc-400 dark:active:bg-white/10"
                        >
                          <i
                            className="i-mingcute-close-line size-5"
                            aria-hidden="true"
                          />
                        </button>
                      </Drawer.Close>
                    )}
                  </m.div>
                ) : (
                  title && (
                    <Drawer.Title className="-mt-4 mb-4 flex justify-center text-lg font-medium">
                      {title}
                    </Drawer.Title>
                  )
                )}

                <div
                  className={
                    touchFriendly
                      ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                      : 'contents'
                  }
                >
                  {typeof content === 'function'
                    ? React.createElement(content)
                    : content}
                </div>
                <div ref={setHolderRef} />
              </m.div>
            </SheetContext.Provider>
          </Drawer.Content>
          {!modal && (
            <button
              type="button"
              aria-label="关闭弹窗"
              onClick={() => changeOpen(false)}
              className="fixed inset-0 bg-neutral-800/40"
              style={{
                zIndex: overlayZIndex,
                opacity: transition.entered ? 1 : 0,
                pointerEvents: isOpen && !covered ? 'auto' : 'none',
                transition: `opacity ${transition.duration}ms ${sheetTransitionEase}`,
              }}
            />
          )}
          <Drawer.Overlay
            forceMount
            className="fixed inset-0 bg-neutral-800/40"
            style={{
              zIndex: overlayZIndex,
              animation: 'none',
              opacity: transition.entered ? 1 : 0,
              pointerEvents: isOpen && !covered ? 'auto' : 'none',
              transition: `opacity ${transition.duration}ms ${sheetTransitionEase}`,
            }}
          />
        </Drawer.Portal>
      )}
    </Root>
  )
})
