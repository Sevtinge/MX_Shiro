import type { PostMeta } from '@mx-space/api-client'

import { Banner } from '~/components/ui/banner'
import { getAiParticipationLabels } from '~/lib/ai-participation'

/** Optional presentation metadata shared by posts and notes. */
export const ArticleAiDeclaration = ({ aiGen }: Pick<PostMeta, 'aiGen'>) => {
  const labels = getAiParticipationLabels(aiGen)
  if (labels.length === 0) return null

  return (
    <p className="my-4 flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
      <span className="font-medium">AI 参与声明：</span>
      {Array.isArray(aiGen) ? (
        <span className="inline-flex flex-wrap gap-1.5">
          {labels.map((label, index) => (
            <span
              key={`${index}-${label}`}
              className="rounded-md border border-sky-300/70 bg-sky-100 px-2 py-0.5 dark:border-sky-700 dark:bg-sky-900"
            >
              {label}
            </span>
          ))}
        </span>
      ) : (
        <span>{labels[0]}</span>
      )}
    </p>
  )
}

export const ArticleBanner = ({ banner }: Pick<PostMeta, 'banner'>) => {
  if (!banner) return null

  const items = Array.isArray(banner) ? banner : [banner]

  return (
    <div className="my-6 space-y-4">
      {items.map((item, index) => {
        const message = typeof item === 'string' ? item : item.message
        if (!message) return null

        const type = typeof item === 'string' ? 'info' : item.type
        const supportedType =
          type === 'warning' ||
          type === 'warn' ||
          type === 'error' ||
          type === 'success'
            ? type
            : 'info'

        // Static metadata entries have no identity or local state.
        // eslint-disable-next-line @eslint-react/no-array-index-key
        return <Banner key={index} type={supportedType} message={message} />
      })}
    </div>
  )
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
