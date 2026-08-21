'use client'

import { useActionState } from 'react'
import { loginOrRegister } from '@/lib/auth/actions'
import type { AuthFormState } from '@/lib/auth/definitions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginOrRegister,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          用户名
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
          邮箱
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
        {pending ? '处理中…' : '登录 / 注册'}
      </button>

      <p className="text-xs text-zinc-500">无需密码，邮箱未注册时将自动创建账号。</p>
    </form>
  )
}
