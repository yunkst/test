// 语言/区域相关常量与纯函数。
// 注意：本文件不 import 'server-only'，src/proxy.ts（中间件层）与客户端组件均需引用。

export const locales = ['zh', 'en'] as const
export type Locale = (typeof locales)[number]

export const DEFAULT_LOCALE: Locale = 'zh'

// 语言选择持久化 cookie：切换语言时写入，proxy 检测时优先读取
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

// Intl 格式化使用的 BCP 47 标签（日期等按区域习惯展示）
export const localeTags: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
}

export function hasLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/**
 * 从路径中解析语言前缀。
 * 返回 { locale, rest }：rest 是去掉前缀后的路径（根路径为 '/'）。
 * 例如 getLocaleFromPath('/en/login') → { locale: 'en', rest: '/login' }；
 * 无语言前缀或前缀不受支持时返回 null。
 */
export function getLocaleFromPath(
  pathname: string,
): { locale: Locale; rest: string } | null {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return { locale, rest: '/' }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, rest: pathname.slice(locale.length + 1) }
    }
  }
  return null
}

/** 解析 Accept-Language，取权重最高且受支持的语言（q 缺省视为 1）。 */
function parseAcceptLanguage(header: string): Locale[] {
  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1)
      return { tag: tag.toLowerCase(), q: Number.isNaN(q) ? 0 : q }
    })
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => {
      const base = tag.split('-')[0]
      return base === 'zh' ? 'zh' : base === 'en' ? 'en' : null
    })
    .filter((l): l is Locale => l !== null)
}

/**
 * 检测用户偏好语言：cookie 优先，其次 Accept-Language，兜底默认语言。
 * proxy 与 /ref 跳转场景复用同一套规则，保证语言上下文一致。
 */
export function detectLocale(input: {
  cookie?: string | undefined
  acceptLanguage?: string | undefined
}): Locale {
  const { cookie, acceptLanguage } = input
  if (hasLocale(cookie)) return cookie
  const preferred = acceptLanguage ? parseAcceptLanguage(acceptLanguage) : []
  return preferred[0] ?? DEFAULT_LOCALE
}
