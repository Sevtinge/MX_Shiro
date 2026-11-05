'use client'

import { useEffect, useState } from 'react'

import { clsxm } from '~/lib/helper'

import styles from './AprilFoolsWordArt.module.css'

const FONTS = [
  { family: '"SimSun", "Songti SC", "STSong", serif', floral: false },
  {
    family: '"FangSong", "STFangsong", "FangSong_GB2312", serif',
    floral: false,
  },
  { family: '"KaiTi", "STKaiti", "KaiTi_GB2312", serif', floral: false },
  { family: '"STXingkai", "华文行楷", "KaiTi", cursive', floral: true },
  { family: '"STCaiyun", "华文彩云", "STXingkai", cursive', floral: true },
  { family: '"STXinwei", "华文新魏", "KaiTi", serif', floral: true },
  { family: '"STHupo", "华文琥珀", "KaiTi", serif', floral: true },
  { family: '"FZShuTi", "方正舒体", "STXingkai", cursive', floral: true },
  { family: '"FZYaoTi", "方正姚体", "KaiTi", serif', floral: true },
  { family: '"LiSu", "隶书", "STLiti", serif', floral: true },
  {
    family: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive',
    floral: true,
  },
  {
    family: '"Monotype Corsiva", "French Script MT", "Segoe Script", cursive',
    floral: true,
  },
  {
    family:
      '"Edwardian Script ITC", "Palace Script MT", "Segoe Script", cursive',
    floral: true,
  },
] as const

const KINDS = [
  'gold',
  'purple',
  'sunset',
  'rose',
  'ocean',
  'mint',
  'rainbow',
  'copper',
  'lilac',
  'candy',
  'sky',
  'banner',
] as const

type Kind = (typeof KINDS)[number]
type Extra = 'underline' | 'boxed' | 'glow'

type ChunkStyle = {
  text: string
  kind: Kind
  font: string
  floral: boolean
  rotate: number
  ty: number
  extra?: Extra
}

const pick = <T,>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)]!

const splitEvenly = (value: string, size: number) => {
  const chunks: string[] = []
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size))
  }
  return chunks
}

const chunkText = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= 12) return [trimmed]

  if (/\s/.test(trimmed)) {
    const words = trimmed.split(/\s+/).filter(Boolean)
    if (words.length <= 4) return words
    const size = Math.max(1, Math.ceil(words.length / 4))
    const chunks: string[] = []
    for (let index = 0; index < words.length; index += size) {
      chunks.push(words.slice(index, index + size).join(' '))
    }
    return chunks
  }

  const parts = trimmed
    .split(/(?<=[！？。，、；：!?])/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length > 1) {
    return parts.flatMap((part) =>
      part.length <= 8 ? [part] : splitEvenly(part, 4),
    )
  }

  return splitEvenly(trimmed, 4)
}

const extraFor = (kind: Kind): Extra | undefined => {
  if (kind === 'sky') return Math.random() > 0.35 ? 'boxed' : undefined
  if (kind === 'banner') return Math.random() > 0.7 ? 'underline' : undefined
  if (Math.random() > 0.62) return
  return pick(['underline', 'glow'] as const)
}

export const buildAprilFoolsChunks = (text: string): ChunkStyle[] => {
  const start = Math.floor(Math.random() * KINDS.length)
  const tiltAt = Math.floor(Math.random() * 3)
  return chunkText(text).map((part, index) => {
    const kind = KINDS[(start + index) % KINDS.length]
    const font = pick(FONTS)
    const tilt = index === tiltAt
    return {
      text: part,
      kind,
      font: font.family,
      floral: font.floral,
      rotate:
        Math.round(
          (tilt ? Math.random() * 12 - 4 : Math.random() * 4 - 1.5) * 10,
        ) / 10,
      ty: tilt ? Math.round(Math.random() * 6 - 3) : 0,
      extra: extraFor(kind),
    }
  })
}

export const useAprilFools = () => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const forced = params.get('april1') === '1'
    const today = new Date()
    setActive(forced || (today.getMonth() === 3 && today.getDate() === 1))
  }, [])

  return active
}

export const AprilFoolsText = ({
  text,
  className,
  remix,
}: {
  text: string
  className?: string
  remix?: number
}) => {
  const [chunks, setChunks] = useState<ChunkStyle[] | null>(null)

  useEffect(() => {
    setChunks(buildAprilFoolsChunks(text))
  }, [text, remix])

  if (!chunks) {
    return (
      <span className={className} style={{ display: 'block' }}>
        {text}
      </span>
    )
  }

  return (
    <span
      className={clsxm(styles.line, className)}
      style={{ display: 'flex', width: '100%' }}
    >
      {chunks.map((chunk, index) => (
        <span
          key={`${chunk.text}-${index}`}
          className={clsxm(
            styles.chunk,
            styles[chunk.kind],
            chunk.floral && styles.floral,
            chunk.extra && styles[chunk.extra],
          )}
          style={{
            fontFamily: chunk.font,
            ['--rotate' as string]: `${chunk.rotate}deg`,
            ['--ty' as string]: `${chunk.ty}px`,
          }}
        >
          <span className={styles.face}>{chunk.text}</span>
        </span>
      ))}
    </span>
  )
}
