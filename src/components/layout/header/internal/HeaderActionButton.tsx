import clsx from 'clsx'
import type { JSX } from 'react'
import { forwardRef } from 'react'

export const HeaderActionButton = forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements['div']
>(({ children, ...rest }, ref) => (
  <div
    role="button"
    tabIndex={1}
    className={clsx(
      'group size-[44px] touch-manipulation rounded-full bg-base-100 lg:size-10',
      'px-3 text-[16px] ring-1 ring-zinc-900/5 transition lg:text-sm dark:ring-white/10 dark:hover:ring-white/20',

      'center flex',
    )}
    {...rest}
    ref={ref}
    aria-label="Header Action"
  >
    {children}
  </div>
))

HeaderActionButton.displayName = 'HeaderActionButton'
