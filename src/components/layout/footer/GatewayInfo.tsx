'use client'

import { useOnlineCount } from '~/atoms'
import { useSocketIsConnect } from '~/atoms/hooks'
import { ImpressionView } from '~/components/common/ImpressionTracker'
import { Divider } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { TrackerAction } from '~/constants/tracker'
import { usePageIsActive } from '~/hooks/common/use-is-active'

import { RoomsInfo } from './RoomsInfo'

const ReadingPresencePanel = () => {
  const connected = useSocketIsConnect()

  return (
    <div>
      <ImpressionView
        trackerMessage="socket_status"
        action={TrackerAction.Impression}
      />
      <ConnectionStatus isConnected={connected} />
      <Divider className="!my-3" />
      <RoomsInfo />
      <Divider className="!my-3" />
      <div className="space-y-2 text-sm leading-relaxed text-zinc-500">
        <p>
          当你打开这个页面时，会自动建立 WebSocket
          连接，当成功连接后服务器会推送当前浏览页面的人数。
        </p>
        <p>
          WebSocket
          同时用来通知文章发布、更新，以及下面这份正在被阅读的文章列表。
        </p>
      </div>
    </div>
  )
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  const color = isConnected ? '#3DDC84' : '#FF5A5A'

  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-sm">{isConnected ? '已连接' : '未连接'}</span>
      <span className="relative inline-flex size-2.5" aria-hidden="true">
        <span
          className="absolute -inset-1 rounded-full opacity-70 blur-[2px]"
          style={{ background: color }}
        />
        <span
          className="relative size-2.5 rounded-full"
          style={{ background: color }}
        />
      </span>
    </div>
  )
}

export const GatewayInfo = () => {
  const isActive = usePageIsActive()
  const count = useOnlineCount()

  if (!isActive) return null
  return (
    <FloatPopover
      mobileAsSheet
      trigger="both"
      placement="top"
      offset={12}
      wrapperClassName="inline-flex"
      popoverClassNames="w-[min(32rem,calc(100vw-2rem))]"
      sheet={{
        triggerAsChild: true,
        modal: false,
        noBodyStyles: true,
      }}
      triggerElement={
        <span className="inline-flex items-center gap-2">
          <span>
            当前有 <NumberSmoothTransition>{count}</NumberSmoothTransition>{' '}
            个小伙伴在线
          </span>
          <i className="i-mingcute-question-line cursor-help" />
        </span>
      }
    >
      <ReadingPresencePanel />
    </FloatPopover>
  )
}
