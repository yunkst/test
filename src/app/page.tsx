import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-md text-4xl font-bold tracking-tight">
        推荐返利系统
      </h1>
      <p className="max-w-md text-base leading-7 text-zinc-600">
        注册账号，生成专属邀请链接。好友通过你的链接注册，你将立即获得积分奖励。
      </p>
      <Link
        href="/login"
        className="rounded bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        登录 / 注册
      </Link>
    </main>
  )
}
