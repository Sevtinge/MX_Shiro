'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { API_URL } from '~/constants/env'
import {
  finishSafeLineVerification,
  getSafeLineChallenge,
  getServerSafeLineChallenge,
  probeSafeLineStatus,
  requestSafeLineVerification,
  subscribeSafeLine,
} from '~/lib/safeline-challenge'
import { parseSafeLineCookies } from '~/lib/safeline-clearance'

export const SafeLineVerification = () => {
  const challenge = useSyncExternalStore(
    subscribeSafeLine,
    getSafeLineChallenge,
    getServerSafeLineChallenge,
  )
  const frame = useRef<HTMLIFrameElement>(null)
  const popup = useRef<Window | null>(null)
  const [message, setMessage] = useState(
    '完成验证后会自动继续；若区域无法显示，可在新窗口验证。',
  )

  useEffect(() => {
    if (!challenge) return
    let active = true
    let saving = false
    const controller = new AbortController()
    const onMessage = async (event: MessageEvent) => {
      if (
        event.origin !== new URL(challenge.url).origin ||
        (event.source !== frame.current?.contentWindow &&
          event.source !== popup.current) ||
        event.data?.type !== 'shiro:safeline-verified' ||
        saving
      )
        return
      const cookie = parseSafeLineCookies(event.data.cookies)
      if (
        !cookie &&
        (!Array.isArray(event.data.cookies) || event.data.cookies.length > 0)
      )
        return
      saving = true
      setMessage('验证已完成，正在恢复请求…')
      try {
        if (cookie) {
          // Relay only the WAF JWT to an HttpOnly cookie on the frontend origin.
          // The WAF still validates it, with the original visitor IP and UA.
          const response = await fetch('/api/safeline/clearance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookies: [cookie] }),
            signal: controller.signal,
          })
          if (!response.ok) throw new Error('Could not save verification')
        } else {
          const response = await fetch(challenge.probeUrl, {
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          })
          const data = response.ok ? await response.json() : null
          if (!Number.isFinite(data?.t2) || !Number.isFinite(data?.t3))
            throw new Error('Verification incomplete')
        }
        if (active) {
          popup.current?.close()
          setMessage('完成验证后会自动继续；若区域无法显示，可在新窗口验证。')
          finishSafeLineVerification(true)
        }
      } catch {
        if (active) setMessage('暂时无法恢复请求，请在验证窗口刷新后重试。')
      } finally {
        saving = false
      }
    }
    const timeout = setTimeout(() => {
      if (active) {
        setMessage('等待时间较长，请关闭后重试。')
        controller.abort()
      }
    }, 5 * 60_000)
    window.addEventListener('message', onMessage)
    return () => {
      active = false
      controller.abort()
      clearTimeout(timeout)
      window.removeEventListener('message', onMessage)
    }
  }, [challenge])

  return (
    <Dialog.Root
      open={!!challenge}
      onOpenChange={(open) => {
        if (!open) {
          popup.current?.close()
          setMessage('完成验证后会自动继续；若区域无法显示，可在新窗口验证。')
          finishSafeLineVerification(false)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] w-[min(94vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 text-zinc-900 shadow-xl dark:bg-neutral-900 dark:text-zinc-100"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <Dialog.Title className="text-lg font-medium">
            请完成安全验证
          </Dialog.Title>
          <Dialog.Description className="my-2 text-sm text-zinc-500">
            完成雷池验证后，会自动继续刚才的请求。
          </Dialog.Description>
          {challenge && (
            <iframe
              ref={frame}
              title="雷池安全验证"
              src={challenge.url}
              className="mt-4 h-[min(60vh,28rem)] w-full rounded-lg border border-zinc-200 bg-white"
              referrerPolicy="origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
          <p className="my-3 text-sm text-zinc-500">{message}</p>
          <div className="flex items-center justify-end gap-4 text-sm">
            <Dialog.Close className="rounded-lg px-3 py-2 text-zinc-500">
              取消
            </Dialog.Close>
            {challenge && (
              <button
                type="button"
                onClick={() => {
                  popup.current = window.open(
                    challenge.url,
                    'shiro-safeline-verification',
                    'popup,width=720,height=640',
                  )
                }}
                className="rounded-lg bg-accent px-4 py-2 text-white"
              >
                在新窗口验证
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// RSC requests surface a 468 here so verification is performed in the browser.
export const SafeLineRecovery = ({
  autoStart = false,
}: {
  autoStart?: boolean
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const verify = async () => {
    setError('')
    try {
      await requestSafeLineVerification(API_URL)
      router.refresh()
    } catch {
      setError('验证尚未完成，可以重新验证。')
    }
  }
  useEffect(() => {
    if (autoStart) void verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])
  return (
    <div className="space-y-3 text-center">
      <button
        type="button"
        onClick={verify}
        className="rounded-lg bg-accent px-5 py-2 text-white"
      >
        完成安全验证
      </button>
      {error && <p className="text-sm text-zinc-500">{error}</p>}
    </div>
  )
}

export const SafeLineErrorProbe = () => {
  useEffect(() => {
    let active = true
    void probeSafeLineStatus()
      .then(async (required) => {
        if (!active || !required) return
        await requestSafeLineVerification(API_URL)
        if (active) location.reload()
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return <SafeLineVerification />
}
