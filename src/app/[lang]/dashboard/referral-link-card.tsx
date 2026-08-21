'use client'

import { useSyncExternalStore, useState } from 'react'
import type { Dictionary } from '@/lib/i18n/zh'

const emptySubscribe = () => () => {}

export function ReferralLinkCard({
  dict,
  referralCode,
}: {
  dict: Dictionary
  referralCode: string
}) {
  const [copied, setCopied] = useState(false)

  // origin 仅客户端可知：SSR/hydration 期间返回 ''（相对路径），
  // 客户端挂载后切换为 window.location.origin（useSyncExternalStore 处理差异）
  const origin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => '',
  )

  const link = `${origin}/ref/${referralCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 break-all rounded border border-zinc-200 bg-white px-3 py-2 font-mono text-sm">
          {link}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {copied ? dict.referralCard.copied : dict.referralCard.copy}
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {dict.referralCard.helper}
      </p>
    </div>
  )
}
