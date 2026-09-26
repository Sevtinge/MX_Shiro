'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { deleteActivityPresence } from '~/atoms/activity'
import { useSocketIsConnect, useSocketSessionId } from '~/atoms/hooks'
import { usePageIsActive } from '~/hooks/common/use-is-active'
import { useIsClient } from '~/hooks/common/use-is-client'
import { queryClient } from '~/providers/root/react-query-provider'
import { SocketEmitEnum } from '~/types/events'

import { socketWorker } from '../../socket/worker-client'

export const SocketContainer = () => {
  return useIsClient() ? <SocketContainerImpl /> : null
}
const SocketContainerImpl: Component = () => {
  const router = useRouter()
  useEffect(() => {
    socketWorker.setRouter(router)
  }, [router])

  const webSocketSessionId = useSocketSessionId()
  const previousWebSocketSessionIdRef = useRef(webSocketSessionId)

  const socketIsConnected = useSocketIsConnect()
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    if (!socketIsConnected) return
    // Reconcile events that may have been missed while the gateway was offline.
    if (hasConnectedRef.current) {
      for (const queryKey of [
        ['home'],
        ['home-activity-recent'],
        ['rooms'],
        ['activity'],
      ]) {
        queryClient.invalidateQueries({ queryKey })
      }
      router.refresh()
    }
    hasConnectedRef.current = true
  }, [socketIsConnected, router])

  useEffect(() => {
    const previousWebSocketSessionId = previousWebSocketSessionIdRef.current
    previousWebSocketSessionIdRef.current = webSocketSessionId
    if (!socketIsConnected) return

    socketWorker.emit(SocketEmitEnum.UpdateSid, {
      sessionId: webSocketSessionId,
    })

    ///

    deleteActivityPresence(previousWebSocketSessionId)
  }, [socketIsConnected, webSocketSessionId])

  const pageIsActive = usePageIsActive()
  useEffect(() => {
    if (pageIsActive && !socketIsConnected) {
      socketWorker.reconnect()
    }
  }, [pageIsActive, socketIsConnected])

  return null
}
