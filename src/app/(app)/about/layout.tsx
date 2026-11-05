import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

import { NormalContainer } from '~/components/layout/container/Normal'

export const metadata: Metadata = {
  title: '关于',
  description: '哇！谢谢你愿意来了解我~',
}

export default function Layout(props: PropsWithChildren) {
  return <NormalContainer>{props.children}</NormalContainer>
}
