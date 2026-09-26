'use client'

import { useEffect } from 'react'

import { useSocketIsConnect } from '~/atoms/hooks'
import { socketWorker } from '~/socket/worker-client'
import { SocketEmitEnum } from '~/types/events'

/** Join the room used by the gateway for per-article presence and updates. */
export const ArticleRoomPresence = ({ id }: { id: string }) => {
  const connected = useSocketIsConnect()

  useEffect(() => {
    if (!connected || !id) return
    const roomName = `article_${id}`
    let joined = false
    const join = () => {
      if (joined) return
      socketWorker.emit(SocketEmitEnum.Join, { roomName })
      joined = true
    }
    const leave = () => {
      if (!joined) return
      socketWorker.emit(SocketEmitEnum.Leave, { roomName })
      joined = false
    }

    join()
    // A SharedWorker outlives individual tabs. Release this tab's room on
    // pagehide, and restore it when returning from the back-forward cache.
    window.addEventListener('pagehide', leave)
    window.addEventListener('pageshow', join)
    return () => {
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('pageshow', join)
      leave()
    }
  }, [connected, id])

  return null
}
