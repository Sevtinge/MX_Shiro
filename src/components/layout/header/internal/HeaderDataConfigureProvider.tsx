'use client'

import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { cloneDeep } from '~/lib/lodash'
import { publicContentQueryOptions } from '~/lib/publication'
import { publicApiClient as apiClient } from '~/lib/request'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import { headerMenuConfig as baseHeaderMenuConfig } from '../config'

const HeaderMenuConfigContext = createContext({
  config: baseHeaderMenuConfig,
})

export const useHeaderConfig = () => useContext(HeaderMenuConfigContext)
export const HeaderDataConfigureProvider: Component = ({ children }) => {
  const pageMeta = useAggregationSelector(
    (aggregationData) => aggregationData.pageMeta,
  )
  const categories = useAggregationSelector(
    (aggregationData) => aggregationData.categories,
  )
  // Some aggregate responses omit categories; fetch the public category list
  // separately so the 文稿 dropdown still has its sections.
  const { data: fallbackCategories } = useQuery({
    queryKey: ['header-categories'],
    queryFn: async () => (await apiClient.category.getAllCategories()).data,
    initialData: categories ?? undefined,
    ...publicContentQueryOptions,
  })
  const resolvedCategories = fallbackCategories ?? categories
  const [headerMenuConfig, setHeaderMenuConfig] = useState(baseHeaderMenuConfig)

  useEffect(() => {
    const nextMenuConfig = cloneDeep(baseHeaderMenuConfig)
    if (pageMeta) {
      const homeIndex = nextMenuConfig.findIndex((item) => item.type === 'Home')
      if (homeIndex !== -1) {
        const reservedPaths = new Set(
          baseHeaderMenuConfig.flatMap((item) => [
            item.path,
            ...(item.subMenu?.map((sub) => sub.path) ?? []),
          ]),
        )
        nextMenuConfig[homeIndex].subMenu = []
        for (const page of pageMeta) {
          const path = `/${page.slug}`
          // About pages already live under the 关于 menu.
          if (reservedPaths.has(path)) continue
          nextMenuConfig[homeIndex].subMenu!.push({
            path,
            title: page.title,
          })
        }
      }
    }

    if (resolvedCategories?.length) {
      const postIndex = nextMenuConfig.findIndex((item) => item.type === 'Post')
      if (postIndex !== -1) {
        nextMenuConfig[postIndex].subMenu = []
        for (const category of resolvedCategories) {
          nextMenuConfig[postIndex].subMenu!.push({
            path: `/categories/${category.slug}`,
            title: category.name,
          })
        }
      }
    }

    setHeaderMenuConfig(nextMenuConfig)
  }, [resolvedCategories, pageMeta])

  return (
    <HeaderMenuConfigContext.Provider
      value={useMemo(() => ({ config: headerMenuConfig }), [headerMenuConfig])}
    >
      {children}
    </HeaderMenuConfigContext.Provider>
  )
}
