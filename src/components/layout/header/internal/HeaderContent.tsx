'use client'

import clsx from 'clsx'
import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
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
import { createPortal } from 'react-dom'

import { skipHomeEntranceFromHeader } from '~/atoms/home-entrance'
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
  const lastPointerRef = React.useRef<{
    clientX: number
    clientY: number
  } | null>(null)
  const [fixedHeader, setFixedHeader] = React.useState<HTMLElement | null>(null)
  const [headerHovered, setHeaderHovered] = React.useState(false)
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

  React.useEffect(() => {
    const rememberPointer = (event: MouseEvent) => {
      lastPointerRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
    }
    window.addEventListener('mousemove', rememberPointer, { passive: true })
    window.addEventListener('wheel', rememberPointer, { passive: true })
    return () => {
      window.removeEventListener('mousemove', rememberPointer)
      window.removeEventListener('wheel', rememberPointer)
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    const header = navRef.current?.closest('header') ?? null
    setFixedHeader(header)
    if (!header) return

    const navBounds = navRef.current?.getBoundingClientRect()
    if (!navBounds) return

    const pointer = lastPointerRef.current
    const isInside = (bounds: DOMRect) =>
      pointer !== null &&
      pointer.clientX >= bounds.left &&
      pointer.clientX <= bounds.right &&
      pointer.clientY >= bounds.top &&
      pointer.clientY <= bounds.bottom

    radius.set(Math.hypot(navBounds.width, navBounds.height) / 2.5)

    if (!shouldHideNavBg) {
      if (isInside(navBounds)) {
        mouseX.set(pointer!.clientX - navBounds.left)
        mouseY.set(pointer!.clientY - navBounds.top)
      }
      return
    }

    const headerBounds = header.getBoundingClientRect()
    mouseX.set(
      isInside(headerBounds)
        ? pointer!.clientX - headerBounds.left
        : navBounds.left - headerBounds.left + navBounds.width / 2,
    )
    mouseY.set(
      isInside(headerBounds)
        ? pointer!.clientY - headerBounds.top
        : navBounds.top - headerBounds.top + navBounds.height / 2,
    )

    const updateSpotlight = (event: MouseEvent) => {
      const bounds = header.getBoundingClientRect()
      mouseX.set(event.clientX - bounds.left)
      mouseY.set(event.clientY - bounds.top)
      const nav = navRef.current?.getBoundingClientRect()
      if (nav) radius.set(Math.hypot(nav.width, nav.height) / 2.5)
    }
    const showSpotlight = () => setHeaderHovered(true)
    const hideSpotlight = () => setHeaderHovered(false)

    setHeaderHovered(header.matches(':hover'))
    header.addEventListener('mousemove', updateSpotlight)
    header.addEventListener('mouseenter', showSpotlight)
    header.addEventListener('mouseleave', hideSpotlight)

    return () => {
      header.removeEventListener('mousemove', updateSpotlight)
      header.removeEventListener('mouseenter', showSpotlight)
      header.removeEventListener('mouseleave', hideSpotlight)
    }
  }, [shouldHideNavBg, mouseX, mouseY, radius])
  return (
    <m.nav
      ref={navRef}
      layout="size"
      onMouseMove={shouldHideNavBg ? undefined : handleMouseMove}
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
      {/* Keep the pill spotlight only while the navigation is floating. */}
      {!shouldHideNavBg && (
        <m.div
          className="pointer-events-none absolute -inset-px rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background }}
          aria-hidden="true"
        />
      )}
      {shouldHideNavBg &&
        fixedHeader &&
        createPortal(
          <m.div
            className="pointer-events-none absolute inset-0 [--spotlight-color:oklch(var(--a)_/_0.12)] transition-opacity duration-500"
            style={{ background, opacity: headerHovered ? 1 : 0 }}
            aria-hidden="true"
          />,
          fixedHeader,
        )}
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
        onClick={(event) => {
          if (
            href === '/' &&
            event.button === 0 &&
            !event.defaultPrevented &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            skipHomeEntranceFromHeader()
          }
        }}
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
