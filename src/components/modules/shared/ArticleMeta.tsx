import type { PostMeta } from '@mx-space/api-client'

import { Banner } from '~/components/ui/banner'

/** Optional presentation metadata shared by posts and notes. */
export const ArticleAiDeclaration = ({ aiGen }: Pick<PostMeta, 'aiGen'>) => {
  if (!aiGen) return null

  return (
    <p className="my-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
      <span className="font-medium">AI 参与声明：</span>
      <span>
        {typeof aiGen === 'string' ? aiGen : '本文创作过程中使用了 AI 辅助。'}
      </span>
    </p>
  )
}

export const ArticleBanner = ({ banner }: Pick<PostMeta, 'banner'>) => {
  if (!banner) return null

  const message = typeof banner === 'string' ? banner : banner.message
  if (!message) return null

  const type = typeof banner === 'string' ? 'info' : banner.type
  const supportedType =
    type === 'warning' || type === 'warn' || type === 'error' || type === 'success'
      ? type
      : 'info'

  return <Banner className="my-6" type={supportedType} message={message} />
}

export const ArticleCover = ({ cover }: Pick<PostMeta, 'cover'>) => {
  if (!cover) return null

  return (
    <div
      role="img"
      aria-label="文章封面"
      className="mb-8 aspect-[838/224] w-full rounded-lg bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${JSON.stringify(cover)})` }}
    />
  )
}
