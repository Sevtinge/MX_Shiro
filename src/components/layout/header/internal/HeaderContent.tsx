'use client'

import clsx from 'clsx'
import {
  AnimatePresence,
  LayoutGroup,
  m,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { memo } from 'react'

import { RootPortal } from '~/components/ui/portal'
import useDebounceValue from '~/hooks/common/use-debounce-value'
import { clsxm } from '~/lib/helper'
import { useIsScrollUpAndPageIsOver } from '~/providers/root/page-scroll-info-provider'

import type { IHeaderMenu } from '../config'
import { useHeaderConfig } from './HeaderDataConfigureProvider'
import { useHeaderHasMetaInfo, useMenuOpacity } from './hooks'
import { MenuPopover } from './MenuPopover'

export const HeaderContent = () => {
  return (
    <LayoutGroup>
      <AnimatedMenu>
        <ForDesktop />
      </AnimatedMenu>
      <AccessibleMenu />
    </LayoutGroup>
  )
}

const AccessibleMenu: Component = () => {
  const hasMetaInfo = useHeaderHasMetaInfo()

  const showShow = useDebounceValue(
    useIsScrollUpAndPageIsOver(600) && hasMetaInfo,
    120,
  )
  return (
    <RootPortal>
      <AnimatePresence>
        {showShow && (
          <m.div
            layout
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            exit={{ y: -20, opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-12 z-10 mr-[var(--removed-body-scroll-bar-size)] flex justify-center"
          >
            <ForDesktop />
          </m.div>
        )}
      </AnimatePresence>
    </RootPortal>
  )
}

const AnimatedMenu: Component = ({ children }) => {
  const opacity = useMenuOpacity()

  const hasMetaInfo = useHeaderHasMetaInfo()
  const shouldHideNavBg = !hasMetaInfo && opacity === 0
  return (
    <m.div
      className="duration-100"
      style={{
        opacity: hasMetaInfo ? opacity : 1,
        visibility: opacity === 0 && hasMetaInfo ? 'hidden' : 'visible',
      }}
    >
      {/* @ts-ignore */}
      {React.cloneElement(children, { shouldHideNavBg })}
    </m.div>
  )
}

const ForDesktop: Component<{
  shouldHideNavBg?: boolean
  animatedIcon?: boolean
}> = ({ className, shouldHideNavBg, animatedIcon = true }) => {
  const { config: headerMenuConfig } = useHeaderConfig()
  const pathname = usePathname()
  const navRef = React.useRef<HTMLElement>(null)
  const fullMenuRef = React.useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = React.useState(false)
  const fullMenu = React.useMemo(
    () =>
      headerMenuConfig.flatMap((section) =>
        section.title === '更多' && section.path === '#'
          ? (section.subMenu ?? [])
          : [section],
      ),
    [headerMenuConfig],
  )

  React.useEffect(() => {
    // Measure the center cell, not the intrinsic-width AnimatedMenu wrapper.
    // The floating accessible menu uses its full-width portal wrapper instead.
    const availableArea =
      navRef.current?.closest<HTMLElement>('[data-header-menu-area]') ??
      navRef.current?.parentElement
    const fullMenuElement = fullMenuRef.current
    if (!availableArea || !fullMenuElement) return

    const update = () => {
      setShowAll(fullMenuElement.scrollWidth + 2 <= availableArea.clientWidth)
    }
    const observer = new ResizeObserver(update)
    observer.observe(availableArea)
    observer.observe(fullMenuElement)
    update()
    return () => observer.disconnect()
  }, [fullMenu, pathname])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(0)
  const handleMouseMove = React.useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
      radius.set(Math.hypot(bounds.width, bounds.height) / 2.5)
    },
    [mouseX, mouseY, radius],
  )

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, var(--spotlight-color) 0%, transparent 65%)`

  return (
    <m.nav
      ref={navRef}
      layout="size"
      onMouseMove={handleMouseMove}
      className={clsxm(
        'relative',
        'rounded-full bg-gradient-to-b from-zinc-50/70 to-white/90',
        'shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md',
        'dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10',
        'group [--spotlight-color:oklch(var(--a)_/_0.12)]',
        'pointer-events-auto duration-200',
        shouldHideNavBg && '!bg-none !shadow-none !ring-transparent',
        className,
      )}
    >
      {/* Spotlight overlay */}
      <m.div
        className="pointer-events-none absolute -inset-px rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background }}
        aria-hidden="true"
      />
      {/* Measure the fully expanded menu independently of the visible navigation. */}
      <div
        ref={fullMenuRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max px-4 font-medium"
      >
        {fullMenu.map((section) => {
          const active = getMenuActiveState(section, pathname)
          return (
            <span
              key={section.path}
              className="block whitespace-nowrap px-4 py-2"
            >
              {active.isActive && (
                <span className="mr-2 inline-flex items-center">
                  {active.subItemActive?.icon ?? section.icon}
                </span>
              )}
              <span>{active.subItemActive?.title ?? section.title}</span>
            </span>
          )
        })}
      </div>
      <div className="flex px-4 font-medium text-zinc-800 dark:text-zinc-200">
        {(showAll ? fullMenu : headerMenuConfig).map((section) => {
          const { isActive, subItemActive } = getMenuActiveState(
            section,
            pathname,
          )

          return (
            <HeaderMenuItem
              iconLayout={animatedIcon}
              section={section}
              key={section.path}
              subItemActive={subItemActive}
              isActive={isActive}
            />
          )
        })}
      </div>
    </m.nav>
  )
}

function getMenuActiveState(section: IHeaderMenu, pathname: string) {
  const subItemActive = section.subMenu?.find((item) => item.path === pathname)
  return {
    subItemActive,
    isActive:
      pathname === section.path ||
      (section.path !== '#' &&
        pathname.startsWith(`${section.path}/`) &&
        !section.exclude?.includes(pathname)) ||
      !!subItemActive,
  }
}

const HeaderMenuItem = memo<{
  section: IHeaderMenu
  isActive: boolean
  subItemActive?: IHeaderMenu
  iconLayout?: boolean
}>(({ section, isActive, subItemActive, iconLayout }) => {
  const href = section.path

  return (
    <MenuPopover subMenu={section.subMenu} key={href}>
      <AnimatedItem
        href={href}
        isActive={isActive}
        className="transition-[padding]"
      >
        <span className="relative flex items-center">
          {isActive && (
            <m.span
              layoutId={iconLayout ? 'header-menu-icon' : undefined}
              className="mr-2 flex items-center"
            >
              {subItemActive?.icon ?? section.icon}
            </m.span>
          )}
          <m.span layout>{subItemActive?.title ?? section.title}</m.span>
        </span>
      </AnimatedItem>
    </MenuPopover>
  )
})
HeaderMenuItem.displayName = 'HeaderMenuItem'

function AnimatedItem({
  href,
  children,
  className,
  isActive,
}: {
  href: string
  children: React.ReactNode
  className?: string
  isActive?: boolean
}) {
  const isExternal = href.startsWith('http')
  const As = isExternal ? 'a' : Link
  return (
    <div>
      <As
        href={href}
        className={clsxm(
          'relative block whitespace-nowrap px-4 py-2 transition',
          isActive ? 'text-accent' : 'hover:text-accent/80',
          isActive ? 'active' : '',
          className,
        )}
        target={isExternal ? '_blank' : undefined}
      >
        {children}
        {isActive && (
          <m.span
            className={clsx(
              'absolute inset-x-1 -bottom-px h-px',
              'bg-gradient-to-r from-accent/0 via-accent/70 to-accent/0',
            )}
            layoutId="active-nav-item"
          />
        )}
      </As>
    </div>
  )
}
