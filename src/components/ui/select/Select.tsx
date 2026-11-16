'use client'

import * as SelectImpl from '@radix-ui/react-select'
import type { PropsWithChildren } from 'react'
import * as React from 'react'

import { clsxm } from '~/lib/helper'

export type SelectValue<T> = {
  value: T
  label: string
}

interface SelectProps<T> {
  values: SelectValue<T>[]
  value: T
  onChange: (
    value: T,
    item: {
      value: T
      label: string
    },
  ) => void

  isLoading?: boolean
  placeholder?: string
}

export const Select = function Select<T>(
  props: SelectProps<T> & {
    className?: string
  },
) {
  const { value, className, values, onChange, isLoading, placeholder } = props
  return (
    <SelectImpl.Root
      // @ts-expect-error
      value={value}
      onValueChange={(value) => {
        // @ts-expect-error
        onChange(value, values.find((item) => item.value === value)!)
      }}
    >
      <SelectImpl.Trigger
        className={clsxm(
          'inline-flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-zinc-800',
          'bg-zinc-900/[0.03] ring-1 ring-zinc-900/10 transition-colors hover:ring-accent/40',
          'dark:bg-white/[0.04] dark:text-zinc-100 dark:ring-white/10',

          className,
        )}
      >
        <SelectImpl.Value placeholder={placeholder} />
        <SelectImpl.Icon className="flex items-center">
          {isLoading ? (
            <i className="i-mingcute-loading-line animate-spin" />
          ) : (
            <i className="i-mingcute-down-line" />
          )}
        </SelectImpl.Icon>
      </SelectImpl.Trigger>
      <SelectImpl.Portal>
        <SelectImpl.Content className="z-[990] overflow-hidden rounded-xl bg-gradient-to-b from-zinc-50/95 to-white/95 p-1 shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/95 dark:to-zinc-800/95 dark:ring-zinc-100/10">
          <SelectImpl.ScrollUpButton className="flex h-3 items-center justify-center">
            <i className="i-mingcute-up-line" />
          </SelectImpl.ScrollUpButton>
          <SelectImpl.Viewport>
            {values.map((item) => (
              <SelectItem
                key={item.label + item.value}
                // @ts-expect-error
                value={item.value}
                onSelect={() => onChange(item.value, item)}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectImpl.Viewport>
          <SelectImpl.ScrollDownButton className="flex h-3 items-center justify-center">
            <i className="i-mingcute-down-line" />
          </SelectImpl.ScrollDownButton>
        </SelectImpl.Content>
      </SelectImpl.Portal>
    </SelectImpl.Root>
  )
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<SelectImpl.SelectItemProps>
>(({ children, ...props }, forwardedRef) => {
  return (
    <SelectImpl.Item
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent dark:text-zinc-200"
      {...props}
      ref={forwardedRef}
    >
      <SelectImpl.ItemText asChild>
        <span className="pointer-events-none min-w-0 select-none truncate">
          {children}
        </span>
      </SelectImpl.ItemText>

      <SelectImpl.ItemIndicator className="shrink-0">
        <i className="i-mingcute-check-line" />
      </SelectImpl.ItemIndicator>
    </SelectImpl.Item>
  )
})

SelectItem.displayName = 'SelectItem'
