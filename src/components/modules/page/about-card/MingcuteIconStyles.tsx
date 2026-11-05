import { mingcuteIconCss } from '~/lib/mingcute-icons'

export function MingcuteIconStyles({ text }: { text?: string | null }) {
  const css = mingcuteIconCss(text)
  if (!css) return null
  return (
    <style data-mingcute-icons="" dangerouslySetInnerHTML={{ __html: css }} />
  )
}
