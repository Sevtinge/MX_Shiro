import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

import { NormalContainer } from '~/components/layout/container/Normal'
import { thinkingEnabled } from '~/constants/features'

export const metadata: Metadata = {
  title: '思考',
}
export default async function Layout(props: PropsWithChildren) {
  if (!thinkingEnabled) redirect('/')
  return <NormalContainer>{props.children}</NormalContainer>
}
