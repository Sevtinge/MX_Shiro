'use client'

import type { FC } from 'react'

import { clsxm } from '~/lib/helper'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

const bannerClassNames = {
  info: `bg-sky-50 dark:bg-sky-800 dark:text-white`,
  warning: `bg-orange-100 dark:bg-orange-800 dark:text-white`,
  error: `bg-rose-100 dark:bg-rose-800 dark:text-white`,
  success: `bg-emerald-100 dark:bg-emerald-800 dark:text-white`,
  secondary: `bg-sky-100 dark:bg-sky-800 dark:text-white`,
}

const useNoteBanner = () => {
  const banner = useCurrentNoteDataSelector((n) => n?.data.meta?.banner)
  if (!banner) return []

  return (Array.isArray(banner) ? banner : [banner])
    .map((item) => {
      if (typeof item === 'string') return { type: 'info' as const, message: item }
      const { type } = item
      return {
        ...item,
        type: type && type in bannerClassNames
          ? (type as keyof typeof bannerClassNames)
          : 'info' as const,
      }
    })
    .filter((item) => item.message)
}

export const NoteRootBanner = () => {
  const banner = useNoteBanner()

  if (banner.length === 0) return null

  return (
    <div className="mb-4 mt-8">
      {banner.map((item, index) => (
        // Static metadata entries have no identity or local state.
        // eslint-disable-next-line @eslint-react/no-array-index-key
        <NoteBanner key={index} {...item} />
      ))}
    </div>
  )
}

export const NoteBanner: FC<{
  style?: any
  className?: string
  message: string
  type?: keyof typeof bannerClassNames
}> = (banner) => {
  return (
    <div
      className={clsxm(
        'mt-4 flex justify-center whitespace-pre-line p-4 text-base leading-8',
        'lg:-ml-12 lg:w-[calc(100%+6rem)]',
        // '-ml-4 w-[calc(100%+2rem)]',
        'mx-[var(--padding-h)]',

        bannerClassNames[banner.type as keyof typeof bannerClassNames],
        banner.className,
      )}
      style={banner.style}
    >
      {banner.message}
    </div>
  )
}
