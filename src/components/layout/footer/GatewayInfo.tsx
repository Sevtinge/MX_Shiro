'use client'

import { useOnlineCount } from '~/atoms'
import { useSocketIsConnect } from '~/atoms/hooks'
import { ImpressionView } from '~/components/common/ImpressionTracker'
import { Divider } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { TrackerAction } from '~/constants/tracker'
import { usePageIsActive } from '~/hooks/common/use-is-active'

const Help = () => {
  return (
    <FloatPopover
      mobileAsSheet
      as="span"
      triggerElement={<i className="i-mingcute-question-line cursor-help" />}
      type="tooltip"
      asChild
      sheet={{
        triggerAsChild: true,
        modal: false,
        noBodyStyles: true,
      }}
    >
      <div className="space-y-2 leading-relaxed">
        <p className="flex items-center space-x-1 opacity-80">
          <i className="i-mingcute-question-line" />
          <span className="font-medium">这是如何实现的？</span>
        </p>
        <p>
          当你打开这个页面时，会自动建立 WebSocket
          连接，当成功连接后服务器会推送当前浏览页面的人数。
        </p>
        <p>
          WebSocket
          用于通知站点，站长在站点的实时活动，包括不限于文章的发布和更新。
        </p>

        <Divider />

        <p>
          当前 Socket 状态： <ConnectedIndicator />
        </p>
      </div>
    </FloatPopover>
  )
}

const ConnectedIndicator = () => {
  const connected = useSocketIsConnect()

  return (
    <div className="inline-flex items-center">
      <ImpressionView
        trackerMessage="socket_status"
        action={TrackerAction.Impression}
      />
      <ConnectionStatus isConnected={connected} />
    </div>
  )
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  const color = isConnected ? '#00FC47' : '#FC0000'
  const secondaryColor = isConnected
    ? 'rgba(174, 244, 194, 0.46)'
    : 'rgba(244, 174, 174, 0.46)'
  const text = isConnected ? '已连接' : '未连接'

  const backgroundStyle = {
    background: `radial-gradient(45.91% 45.91% at 49.81% 54.09%, ${color} 7.13%, ${secondaryColor} 65.83%, rgba(252, 252, 252, 0.00) 100%)`,
  }

  return (
    <>
      <span className="absolute size-5" style={backgroundStyle} />
      <span className="ml-6">{text}</span>
    </>
  )
}

export const GatewayInfo = () => {
  const isActive = usePageIsActive()
  const count = useOnlineCount()

  if (!isActive) return null
  return (
    <div className="inline-flex items-center gap-2">
      <span>
        当前有 <NumberSmoothTransition>{count}</NumberSmoothTransition>{' '}
        个小伙伴在线
      </span>
      <Help />
    </div>
  )
}
