'use client'

import { m } from 'motion/react'
import type { PropsWithChildren } from 'react'
import { startTransition } from 'react'

import { ArticleHoverHighlight } from '~/components/modules/post/PostItemHoverOverlay'
import { useSheetEntrance } from '~/components/ui/sheet/use-sheet-entrance'

import { listHighlightTransition } from './list-highlight-transition'

export const ListHighlightRow = ({
  active,
  index,
  layoutId,
  onSelect,
  children,
}: PropsWithChildren<{
  active: boolean
  index: number
  layoutId: string
  onSelect: () => void
}>) => {
  const entrance = useSheetEntrance(index + 1)
  return (
    <li
      className="relative flex w-full justify-between rounded-xl"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') startTransition(onSelect)
      }}
      onFocus={onSelect}
    >
      <ArticleHoverHighlight
        layoutId={layoutId}
        active={active}
        transition={listHighlightTransition}
        className="inset-1.5 z-0 rounded-xl"
      />
      <m.div {...entrance} className="relative z-10 w-full">
        {children}
      </m.div>
    </li>
  )
}
