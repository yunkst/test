import { LoginForm } from './login-form'

export const metadata = { title: '登录 / 注册' }

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">欢迎</h1>
        <p className="mb-6 text-sm text-zinc-600">
          输入用户名和邮箱即可登录；邮箱未注册将自动创建账号。
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
