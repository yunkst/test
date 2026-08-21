import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import {
  LOCALE_COOKIE_NAME,
  detectLocale,
  getLocaleFromPath,
  type Locale,
} from '@/lib/i18n/locale'

// 乐观鉴权：仅检查 session cookie 是否存在（不查库，真实校验交给 DAL 层）。
// 只做廉价的路由级预过滤，不作为完整会话/授权方案。
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value)

  // 邀请短链：顶级路由（无语言段），保持无前缀直达，由 route handler 处理
  // （其内部 redirect('/login') 之后再由本 proxy 补全语言前缀）
  if (pathname === '/ref' || pathname.startsWith('/ref/')) {
    return NextResponse.next()
  }

  // 第一步：补齐语言前缀。路径已有 /zh|/en 前缀 → 直接解析；
  // 否则按 cookie → Accept-Language → 默认语言检测并 302 到带前缀路径（同时持久化 cookie）。
  let locale: Locale
  let rest: string
  const fromPath = getLocaleFromPath(pathname)
  if (fromPath) {
    locale = fromPath.locale
    rest = fromPath.rest
  } else {
    locale = detectLocale({
      cookie: req.cookies.get(LOCALE_COOKIE_NAME)?.value ?? undefined,
      acceptLanguage: req.headers.get('accept-language') ?? undefined,
    })
    req.nextUrl.pathname = `/${locale}${pathname}`
    const res = NextResponse.redirect(req.nextUrl)
    res.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
    return res
  }

  // 第二步：基于去掉语言前缀的 rest 路径做乐观鉴权
  // 受保护路由：未登录 → 登录页
  if (rest.startsWith('/dashboard') && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.nextUrl))
  }
  // 公开路由：已登录 → 直接进 dashboard
  if ((rest === '/' || rest === '/login') && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.nextUrl))
  }
  return NextResponse.next()
}

// 注意：不排除 /ref 邀请短链，保证其总是可达（即使已登录也能访问并设置 ref cookie）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon\\.ico).*)'],
}