import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

// 乐观鉴权：仅检查 session cookie 是否存在（不查库，真实校验交给 DAL 层）。
// 只做廉价的路由级预过滤，不作为完整会话/授权方案。
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value)

  // 受保护路由：未登录 → 登录页
  if (pathname.startsWith('/dashboard') && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  // 公开路由：已登录 → 直接进 dashboard
  if ((pathname === '/' || pathname === '/login') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
  return NextResponse.next()
}

// 注意：不排除 /ref 邀请短链，保证其总是可达（即使已登录也能访问并设置 ref cookie）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon\\.ico).*)'],
}
