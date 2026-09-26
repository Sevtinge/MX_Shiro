import type { SnippetModel } from '@mx-space/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { defineRouteConfig } from '~/components/modules/dashboard/utils/helper'
import { StyledButton } from '~/components/ui/button'
import { apiClient } from '~/lib/request'
import { toast } from '~/lib/toast'

const DEFAULT_BOTTOM_TEXT = '海盐柠檬茶 vs. 抹茶曲奇'

export const config = defineRouteConfig({
  title: '主页设置',
  icon: <i className="i-mingcute-settings-3-line" />,
  priority: 9,
})

async function getThemeSnippet() {
  const response = await apiClient.snippet.proxy
    .group('theme')
    .get<SnippetModel[]>()
  const snippets = response.$serialized
  const snippet = snippets.find((item) => item.name === 'shiro')
  if (!snippet) throw new Error('找不到 Shiro 主题设置')
  return snippet
}

export function Component() {
  const {
    data: snippet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shiro-theme-snippet'],
    queryFn: getThemeSnippet,
  })
  const [bottomText, setBottomText] = useState(DEFAULT_BOTTOM_TEXT)
  const [foundedAt, setFoundedAt] = useState('')
  const [invalidTheme, setInvalidTheme] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!snippet) return
    try {
      const theme = JSON.parse(snippet.raw) as AppThemeConfig
      setBottomText(
        !theme.config.hero.bottomText ||
          theme.config.hero.bottomText ===
            '当第一颗卫星飞向大气层外，我们便以为自己终有一日会征服宇宙。'
          ? DEFAULT_BOTTOM_TEXT
          : theme.config.hero.bottomText,
      )
      setFoundedAt(theme.config.site.foundedAt ?? '')
      setInvalidTheme(false)
    } catch {
      setInvalidTheme(true)
    }
  }, [snippet])

  const { mutateAsync: save, isPending } = useMutation({
    mutationFn: async () => {
      // Read once more before writing, so other theme settings aren't overwritten.
      const latest = await getThemeSnippet()
      const theme = JSON.parse(latest.raw) as AppThemeConfig
      theme.config.hero.bottomText = bottomText
      theme.config.site.foundedAt = foundedAt || undefined

      const id = latest.id ?? (latest as SnippetModel & { _id?: string })._id
      if (!id) throw new Error('主题配置缺少 ID')
      await apiClient.snippet.proxy(String(id)).put({
        data: {
          name: latest.name,
          reference: latest.reference,
          type: latest.type,
          private: latest.private,
          comment: latest.comment,
          metatype: latest.metatype,
          schema: latest.schema,
          raw: JSON.stringify(theme, null, 2),
        },
      })
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['shiro-theme-snippet'] })
      queryClient.invalidateQueries({ queryKey: ['aggregation'] })
      const refreshed = await fetch('/api/theme-refresh', {
        method: 'POST',
      }).catch(() => null)
      toast.success(
        refreshed?.ok ? '主页设置已保存' : '已保存，页面缓存稍后更新',
      )
    },
    onError: () => toast.error('保存失败，请稍后重试'),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save()
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-medium">主页设置</h1>
      {isLoading && <p>正在读取主题设置…</p>}
      {error && <p className="text-red-500">无法读取 Shiro 主题设置。</p>}
      {invalidTheme && (
        <p className="text-red-500">
          主题配置不是有效的 JSON，请先在后台修复。
        </p>
      )}
      {snippet && !invalidTheme && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block space-y-2">
            <span className="block font-medium">主页底部文字</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-zinc-300 bg-transparent p-3 outline-none focus:border-accent dark:border-zinc-700"
              value={bottomText}
              onChange={(event) => setBottomText(event.target.value)}
              maxLength={500}
            />
          </label>
          <label className="block space-y-2">
            <span className="block font-medium">建站日期</span>
            <input
              className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
              type="date"
              value={foundedAt}
              onChange={(event) => setFoundedAt(event.target.value)}
            />
            <small className="block opacity-60">
              留空时，将根据页脚版权年份显示约略的建站时长。
            </small>
          </label>
          <StyledButton type="submit" disabled={isPending}>
            {isPending ? '正在保存…' : '保存设置'}
          </StyledButton>
        </form>
      )}
    </div>
  )
}
