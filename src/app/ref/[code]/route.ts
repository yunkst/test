import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_TTL_S } from '@/lib/auth/constants'

// 邀请短链 /ref/[code]：
// 校验邀请码存在 → 写入一次性 ref cookie（注册时读取，成功后删除）→ 跳转登录页。
// 无效邀请码同样跳转登录页但不写 cookie（注册时无奖励，并会被事务内校验拒绝）。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  })

  if (referrer) {
    ;(await cookies()).set(REFERRAL_COOKIE_NAME, code, {
      httpOnly: true,
      sameSite: 'lax',
      // dev 环境 http 直连必须关闭 secure
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: REFERRAL_COOKIE_TTL_S,
    })
  }

  redirect('/login')
}
