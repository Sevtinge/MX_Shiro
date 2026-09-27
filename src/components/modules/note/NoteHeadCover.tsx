'use client'

import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

export const NoteHeadCover = ({ image }: { image?: string }) => {
  if (!image) return null

  return <NoteHeadCoverImpl image={image} />
}

const NoteHeadCoverImpl = ({ image }: { image: string }) => {
  const accentColor = useCurrentNoteDataSelector((state) =>
    state?.data.images?.find((i) => i.src === image)?.accent,
  )

  return (
    <>
      <div
        data-hide-print
        className="cover-mask-b absolute inset-x-0 top-[-6.5rem] h-[224px] md:top-0"
        style={{ backgroundColor: accentColor }}
      >
        <div
          style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
          className="size-full bg-cover bg-center bg-no-repeat"
        />
      </div>
      <div data-hide-print className="hidden h-[120px] md:block" />
    </>
  )
}
