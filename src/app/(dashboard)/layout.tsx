import type { Viewport } from 'next'
import { PublicEnvScript } from 'next-runtime-env'
import type { PropsWithChildren } from 'react'

import { ClientOnly } from '~/components/common/ClientOnly'
import { HydrationEndDetector } from '~/components/common/HydrationEndDetector'
import { MainLayout } from '~/components/modules/dashboard/layouts'
import { FABContainer } from '~/components/ui/fab'
import { sansFont, serifFont } from '~/lib/fonts'
import { getQueryClient } from '~/lib/query-client.server'
import { DashboardAppProviders } from '~/providers/root'
import { AggregationProvider } from '~/providers/root/aggregation-data-provider'
import { aggregation } from '~/queries/definition/aggregation'

export const dynamic = 'force-dynamic'

export function generateViewport(): Viewport {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: dark)', color: '#000212' },
      { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    ],
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
    minimumScale: 1,
    maximumScale: 1,
  }
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const queryClient = getQueryClient()
  const data = await queryClient.fetchQuery({
    ...aggregation.root(),
  })

  const themeConfig = data.theme

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>Shiro · Light Dashboard | Powered by Mix Space</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <HydrationEndDetector />
        {/* <AccentColorStyleInjector /> */}

        <link
          rel="icon"
          href={themeConfig.config.site.faviconDark}
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          href={themeConfig.config.site.favicon}
          media="(prefers-color-scheme: light)"
        />
        <link rel="apple-touch-icon" href={themeConfig.config.site.favicon} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <PublicEnvScript />
      </head>
      <body
        suppressHydrationWarning
        id="dashboard"
        className={`${sansFont.variable} ${serifFont.variable} m-0 h-full bg-gray-50 p-0 font-sans dark:bg-black`}
      >
        <DashboardAppProviders>
          <AggregationProvider
            aggregationData={data}
            appConfig={themeConfig.config}
          />

          <ClientOnly>
            <MainLayout>{children}</MainLayout>

            <FABContainer />
          </ClientOnly>
        </DashboardAppProviders>
      </body>
    </html>
  )
}
