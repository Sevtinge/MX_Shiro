'use client'

import { m, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { memo } from 'react'

import { skipHomeEntranceFromHeader } from '~/atoms/home-entrance'
import { useSheetContext } from '~/components/ui/sheet/context'
import { reboundPreset } from '~/constants/spring'

import { useHeaderConfig } from './HeaderDataConfigureProvider'

export const HeaderDrawerContent = () => {
  const { config } = useHeaderConfig()
  const { isOpen } = useSheetContext()
  const reducedMotion = useReducedMotion()

  return (
    <div className="scrollbar-none mt-12 max-h-[80dvh] w-[90vw] space-y-4 overflow-auto pb-24">
      {config.map((section, index) => {
        const href = section.path

        return (
          <m.section
            initial={reducedMotion ? false : { y: 30, opacity: 0 }}
            animate={{
              y: isOpen || reducedMotion ? 0 : 16,
              opacity: isOpen ? 1 : 0,
            }}
            transition={
              isOpen
                ? { ...reboundPreset, delay: reducedMotion ? 0 : index * 0.08 }
                : { duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }
            }
            key={href}
          >
            <LinkInternal className="block" href={href}>
              <span className="flex items-center space-x-2 py-2 text-lg">
                <i>{section.icon}</i>
                <h2>{section.title}</h2>
              </span>
            </LinkInternal>

            {section.subMenu && (
              <ul className="my-2 grid grid-cols-2 gap-2">
                {section.subMenu.map((sub) => (
                  <li key={sub.path}>
                    <LinkInternal className="inline-block p-2" href={sub.path}>
                      {sub.title}
                    </LinkInternal>
                  </li>
                ))}
              </ul>
            )}
          </m.section>
        )
      })}
    </div>
  )
}

const LinkInternal: typeof Link = memo(function LinkInternal({
  children,
  ...rest
}) {
  const { dismiss } = useSheetContext()
  return (
    <Link
      {...rest}
      onClick={(event) => {
        if (
          rest.href === '/' &&
          event.button === 0 &&
          !event.defaultPrevented &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          skipHomeEntranceFromHeader()
        }
        dismiss()
      }}
    >
      {children}
    </Link>
  )
})
