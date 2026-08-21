import { getDashboardData } from '@/lib/auth/dal'
import { logout } from '@/lib/auth/actions'
import { REFERRAL_BONUS_POINTS } from '@/lib/auth/constants'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { t } from '@/lib/i18n/format'
import { localeTags, type Locale } from '@/lib/i18n/locale'
import { ReferralLinkCard } from './referral-link-card'

export async function generateMetadata({ params }: PageProps<'/[lang]/dashboard'>) {
  const { lang } = await params
  return { title: getDictionary(lang).dashboard.title }
}

function formatDate(date: Date, lang: Locale) {
  return date.toLocaleDateString(localeTags[lang])
}

function formatDateTime(date: Date, lang: Locale) {
  return date.toLocaleString(localeTags[lang], { hour12: false })
}

export default async function DashboardPage({
  params,
}: PageProps<'/[lang]/dashboard'>) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = getDictionary(lang)
  const { user, referrals, transactions } = await getDashboardData()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(dict.dashboard.greeting, { name: user.name })}
          </h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            {dict.dashboard.logout}
          </button>
        </form>
      </header>

      {/* 积分余额 */}
      <section aria-label={dict.dashboard.pointsLabel}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">
          {dict.dashboard.pointsLabel}
        </h2>
        <p className="text-5xl font-bold tracking-tight">{user.points}</p>
      </section>

      {/* 邀请链接 */}
      <section aria-label={dict.dashboard.inviteTitle}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">
          {dict.dashboard.inviteTitle}
        </h2>
        <ReferralLinkCard dict={dict} referralCode={user.referralCode} />
      </section>

      {/* 邀请记录 */}
      <section aria-label={dict.dashboard.referralsTitle}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">
          {dict.dashboard.referralsTitle}
        </h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {dict.dashboard.referralsEmpty}
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
                    {t(dict.dashboard.pointsEarned, {
                      amount: REFERRAL_BONUS_POINTS,
                    })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(r.createdAt, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 积分流水 */}
      <section aria-label={dict.dashboard.transactionsTitle}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">
          {dict.dashboard.transactionsTitle}
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {dict.dashboard.transactionsEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {(dict.dashboard.reasonLabels as Record<string, string>)[t.reason] ?? t.reason}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(t.createdAt, lang)}
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