'use client'

import { useActionState } from 'react'
import { loginOrRegister } from '@/lib/auth/actions'
import type { AuthFormState } from '@/lib/auth/definitions'
import type { Dictionary } from '@/lib/i18n/zh'
import type { Locale } from '@/lib/i18n/locale'

export function LoginForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginOrRegister,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* locale 随表单提交，服务端 Action 据此选择错误消息语言 */}
      <input type="hidden" name="locale" value={lang} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          {dict.login.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          autoComplete="username"
          className="rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {dict.login.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      {state?.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? dict.login.pending : dict.login.submit}
      </button>

      <p className="text-xs text-zinc-500">{dict.login.helper}</p>
    </form>
  )
}