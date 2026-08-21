'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { getDictionaryForLocale } from '@/lib/i18n/dictionaries'
import { createAuthFormSchema, type AuthFormState } from './definitions'
import { createSession, deleteSession } from './session'
import { registerUser } from './service'
import { verifySession } from './dal'
import { REFERRAL_COOKIE_NAME } from './constants'

// 登录 / 注册一表单：
// - 邮箱已存在 → 用户名匹配则登录（无奖励），不匹配则报错
// - 邮箱不存在 → 注册分支：若有邀请码 cookie 则建立邀请关系并给邀请人发放积分
// 错误消息语言取自表单携带的隐藏 locale 字段（表单 url 路径前缀即语言）。
export async function loginOrRegister(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const dict = getDictionaryForLocale(formData.get('locale'))
  const parsed = createAuthFormSchema(dict).safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const { name, email } = parsed.data

  // 登录分支
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.name.trim() !== name.trim()) {
      return { message: dict.errors.nameMismatch }
    }
    await createSession(existing.id)
    redirect('/dashboard')
  }

  // 注册分支（含 P2002 并发注册兜底；redirect 放在 try 外避免吞掉 NEXT_REDIRECT）
  try {
    const refCode = (await cookies()).get(REFERRAL_COOKIE_NAME)?.value
    const session = await verifySession()
    const result = await registerUser({
      name,
      email,
      refCode,
      currentUserId: session?.userId ?? null,
    })
    if (!result.ok) {
      return {
        message:
          result.code === 'INVALID_REFERRAL_CODE'
            ? dict.errors.invalidReferralCode
            : dict.errors.selfReferral,
      }
    }
    await createSession(result.userId)
    // 邀请码 cookie 一次性使用，注册成功后清除
    ;(await cookies()).delete(REFERRAL_COOKIE_NAME)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { message: dict.errors.emailTaken }
    }
    throw error
  }

  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}