'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  getLocaleFromPath,
  hasLocale,
  locales,
  type Locale,
} from '@/lib/i18n/locale'

/**
 * 将路径中的语言前缀替换为目标语言，其余路径保持不变。
 * 例如 switchPathname('/en/login', 'en', 'zh') → '/zh/login'；
 * 无语言前缀时直接补前缀（'/login' → '/zh/login'）。
 * 纯函数，便于单测。
 */
export function switchPathname(
  pathname: string,
  from: Locale,
  to: Locale,
): string {
  const parsed = getLocaleFromPath(pathname)
  const rest = parsed?.locale === from ? parsed.rest : pathname
  return `/${to}${rest === '/' ? '' : rest}`
}

function getCurrentFromCookie(parsed: { locale: Locale } | null): Locale {
  // 路径无语言前缀（如 RSC 导航后的中间态 URL）时，以 NEXT_LOCALE cookie 兜底
  if (parsed) return parsed.locale
  const match =
    typeof document !== 'undefined' &&
    document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  return match && hasLocale(match[1]) ? match[1] : DEFAULT_LOCALE
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  const current = getCurrentFromCookie(getLocaleFromPath(pathname))
  const target = locales.find((l) => l !== current) ?? current

  function handleToggle() {
    const nextPath = switchPathname(pathname, current, target)
    document.cookie = `${LOCALE_COOKIE_NAME}=${target}; path=/; max-age=31536000; samesite=lax`
    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="fixed right-4 top-4 z-10">
      <button
        type="button"
        onClick={handleToggle}
        className="rounded border border-zinc-300 bg-white/80 px-3 py-1.5 text-sm text-zinc-700 backdrop-blur hover:bg-zinc-100"
      >
        {current === 'zh' ? 'EN' : '中文'}
      </button>
    </div>
  )
}
