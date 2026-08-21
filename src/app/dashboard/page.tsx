import { getDashboardData } from '@/lib/auth/dal'
import { logout } from '@/lib/auth/actions'
import { REFERRAL_BONUS_POINTS } from '@/lib/auth/constants'
import { ReferralLinkCard } from './referral-link-card'

export const metadata = { title: '我的面板' }

const REASON_LABELS: Record<string, string> = {
  referral_bonus: '邀约奖励',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('zh-CN')
}

function formatDateTime(date: Date) {
  return date.toLocaleString('zh-CN', { hour12: false })
}

export default async function DashboardPage() {
  const { user, referrals, transactions } = await getDashboardData()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            你好，{user.name}
          </h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            退出登录
          </button>
        </form>
      </header>

      {/* 积分余额 */}
      <section aria-label="积分余额">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">积分余额</h2>
        <p className="text-5xl font-bold tracking-tight">{user.points}</p>
      </section>

      {/* 邀请链接 */}
      <section aria-label="邀请链接">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">邀请好友</h2>
        <ReferralLinkCard referralCode={user.referralCode} />
      </section>

      {/* 邀请记录 */}
      <section aria-label="邀请记录">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">邀请记录</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-zinc-500">
            还没有邀请记录，分享你的链接开始吧
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200">
            {referrals.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{r.refereeName}</p>
                  <p className="text-zinc-500">{r.refereeEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-600">
                    +{REFERRAL_BONUS_POINTS} 积分
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(r.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 积分流水 */}
      <section aria-label="积分流水">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">积分流水</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无积分记录</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {REASON_LABELS[t.reason] ?? t.reason}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(t.createdAt)}
                  </p>
                </div>
                <p className="font-medium text-emerald-600">+{t.amount}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
