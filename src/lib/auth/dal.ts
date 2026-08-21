import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { hashToken } from './session'
import { SESSION_COOKIE_NAME } from './constants'

export type UserDTO = {
  id: number
  name: string
  email: string
  referralCode: string
  points: number
}

// 校验会话 cookie：hash 后查 Session 表，无效或过期返回 null。
// 不在此处 redirect（login 页等场景需要 null 语义），重定向收敛到 requireUser。
export const verifySession = cache(async (): Promise<{ userId: number } | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true },
  })
  if (!session || session.expiresAt <= new Date()) return null
  return { userId: session.userId }
})

// 返回当前用户 DTO（白名单字段），未登录返回 null
export const getCurrentUser = cache(async (): Promise<UserDTO | null> => {
  const session = await verifySession()
  if (!session) return null

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, referralCode: true, points: true },
  })
})

// 必须登录：未登录则重定向到登录页（redirect throws，即控制流出口）
export const requireUser = cache(async (): Promise<UserDTO> => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
})

export type DashboardData = {
  user: UserDTO
  referrals: Array<{
    id: number
    refereeName: string
    refereeEmail: string
    createdAt: Date
  }>
  transactions: Array<{
    id: number
    amount: number
    reason: string
    createdAt: Date
  }>
}

// dashboard 一次性取数：用户信息 + 邀请记录 + 积分流水（并行查询）
export async function getDashboardData(): Promise<DashboardData> {
  const user = await requireUser()

  const [referrals, transactions] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: user.id },
      select: {
        id: true,
        createdAt: true,
        referee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return {
    user,
    referrals: referrals.map((r) => ({
      id: r.id,
      refereeName: r.referee.name,
      refereeEmail: r.referee.email,
      createdAt: r.createdAt,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      createdAt: t.createdAt,
    })),
  }
}
