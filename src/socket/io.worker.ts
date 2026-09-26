import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { SocketEmitEnum } from '~/types/events'

/// <reference lib="webworker" />

let ws: Socket | null = null
const roomMembers = new Map<MessagePort | Window, Set<string>>()
const waitingEmitQueue: any[] = []

const hasRoomMember = (roomName: string) =>
  [...roomMembers.values()].some((rooms) => rooms.has(roomName))

function setupIo(config: { url: string; socket_session_id: string }) {
  if (ws) return
  // 使用 socket.io
  console.info('Connecting to io, url:', config.url)

  ws = io(config.url, {
    timeout: 10000,
    reconnectionDelay: 3000,
    autoConnect: false,
    reconnectionAttempts: Infinity,
    transports: ['websocket'],

    query: {
      socket_session_id: config.socket_session_id,
    },
  })
  if (!ws) return

  ws.on('disconnect', () => {
    boardcast({
      type: 'disconnect',
    })
  })

  /**
   * @param {any} payload
   */
  ws.on('message', (payload) => {
    console.info('ws', payload)

    boardcast({
      type: 'message',
      payload,
    })
  })

  ws.on('connect', () => {
    console.info('Connected to ws.io server from SharedWorker')

    if (waitingEmitQueue.length > 0) {
      waitingEmitQueue.forEach((payload) => {
        if (!ws) return
        ws.emit('message', payload)
      })
      waitingEmitQueue.length = 0
    }
    // Socket.IO room membership is lost on reconnect. Restore all rooms before
    // notifying tabs that their connection is ready again.
    for (const roomName of new Set(
      [...roomMembers.values()].flatMap((rooms) => [...rooms]),
    )) {
      ws?.emit('message', { type: SocketEmitEnum.Join, payload: { roomName } })
    }
    boardcast({
      type: 'connect',
      // @ts-expect-error
      payload: ws.id,
    })
  })

  ws.open()
  boardcast({
    type: 'sid',
    payload: ws.id,
  })
}

const ports = [] as MessagePort[]

const preparePort = (port: MessagePort | Window) => {
  port.onmessage = (event) => {
    const { type, payload } = event.data
    console.info('get message from main', event.data)

    switch (type) {
      case 'config': {
        setupIo(payload)
        break
      }
      case 'emit': {
        const roomName = payload?.payload?.roomName
        if (
          (payload?.type === SocketEmitEnum.Join ||
            payload?.type === SocketEmitEnum.Leave) &&
          typeof roomName === 'string'
        ) {
          const wasJoined = hasRoomMember(roomName)
          const rooms = roomMembers.get(port) || new Set<string>()
          if (payload.type === SocketEmitEnum.Join) rooms.add(roomName)
          else rooms.delete(roomName)
          if (rooms.size > 0) roomMembers.set(port, rooms)
          else roomMembers.delete(port)
          const isJoined = hasRoomMember(roomName)
          if (ws?.connected && wasJoined !== isJoined) {
            ws.emit('message', payload)
          }
        } else if (ws) {
          if (ws.connected) ws.emit('message', payload)
          else waitingEmitQueue.push(payload)
        }
        break
      }
      case 'reconnect': {
        if (ws) ws.open()
        break
      }
      case 'init': {
        port.postMessage({ type: 'ping' })

        if (ws) {
          if (ws.connected)
            port.postMessage({ type: 'connect', payload: ws.id })
          port.postMessage({ type: 'sid', payload: ws.id })
        }
        break
      }
      default: {
        console.info('Unknown message type:', type)
      }
    }
  }
}

self.addEventListener('connect', (ev: any) => {
  const event = ev as MessageEvent

  const port = event.ports[0]

  ports.push(port)
  preparePort(port)
  port.start()
})

if (!('SharedWorkerGlobalScope' in self)) {
  ports.push(self as any as MessagePort)
  preparePort(self)
}

function boardcast(payload: any) {
  console.info('[ws] boardcast', payload)
  ports.forEach((port) => {
    port.postMessage(payload)
  })
}
