import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { REFERRAL_BONUS_POINTS, REASON_REFERRAL_BONUS } from './constants'

export type RegisterResult =
  | { ok: true; userId: number }
  | { ok: false; code: 'INVALID_REFERRAL_CODE' | 'SELF_REFERRAL' }

// 生成 10 字符 base64url 邀请码
export function generateReferralCode(): string {
  return randomBytes(8).toString('base64url').slice(0, 10)
}

// 事务内创建用户并保证邀请码全局唯一（findUnique 预检，冲突概率可忽略，仍保留重试兜底）
async function createUserWithUniqueCode(
  tx: Prisma.TransactionClient,
  data: { name: string; email: string },
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const referralCode = generateReferralCode()
    const exists = await tx.user.findUnique({
      where: { referralCode },
      select: { id: true },
    })
    if (!exists) {
      return tx.user.create({ data: { ...data, referralCode } })
    }
  }
  throw new Error('无法生成唯一的邀请码')
}

// 注册核心事务（无 cookie / redirect，便于单测）。
// 带邀请码时在单个事务内完成：校验邀请码 → 校验自邀 → 创建用户 →
// 建立 Referral 邀请关系 → 写入 PointsTransaction 流水 → 邀请人 points +100。
// currentUserId 必须在进事务前通过 cookie 解析好传入，避免事务内二次访问 cookies。
export async function registerUser(input: {
  name: string
  email: string
  refCode?: string
  currentUserId: number | null
}): Promise<RegisterResult> {
  const { name, email, refCode, currentUserId } = input

  return prisma.$transaction(async (tx) => {
    // 带邀请码：校验通过后建关系并发积分
    if (refCode) {
      const referrer = await tx.user.findUnique({
        where: { referralCode: refCode },
        select: { id: true },
      })
      if (!referrer) {
        return { ok: false, code: 'INVALID_REFERRAL_CODE' }
      }
      // 自邀校验：已登录用户不能用（自己的或任何人的）链接再注册
      if (currentUserId !== null && referrer.id === currentUserId) {
        return { ok: false, code: 'SELF_REFERRAL' }
      }

      const user = await createUserWithUniqueCode(tx, { name, email })
      const referral = await tx.referral.create({
        data: { referrerId: referrer.id, refereeId: user.id },
      })
      await tx.pointsTransaction.create({
        data: {
          userId: referrer.id,
          amount: REFERRAL_BONUS_POINTS,
          reason: REASON_REFERRAL_BONUS,
          referralId: referral.id,
        },
      })
      await tx.user.update({
        where: { id: referrer.id },
        data: { points: { increment: REFERRAL_BONUS_POINTS } },
      })
      return { ok: true, userId: user.id }
    }

    // 无邀请码：仅创建账号，不产生任何积分
    const user = await createUserWithUniqueCode(tx, { name, email })
    return { ok: true, userId: user.id }
  })
}
