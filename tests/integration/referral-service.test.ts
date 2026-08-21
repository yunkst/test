import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PrismaClient } from '@/generated/prisma/client'
import { startTestDatabase, stopTestDatabase, type TestDatabase } from './helpers'

let db: TestDatabase
let prisma: PrismaClient

beforeAll(async () => {
  db = await startTestDatabase()
  // 动态 import：确保 PrismaClient 拿到容器连接串（service 内部同样走 @/lib/db）
  ;({ prisma } = await import('@/lib/db'))
}, 180_000)

afterAll(async () => {
  await stopTestDatabase(db.container)
})

// 按外键依赖顺序清表，保证用例互不依赖
beforeEach(async () => {
  await prisma.pointsTransaction.deleteMany()
  await prisma.referral.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
})

describe('registerUser transaction against real PostgreSQL', () => {
  it('无邀请码注册：只创建账号，无邀请关系与积分', async () => {
    const { registerUser } = await import('@/lib/auth/service')

    const result = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      currentUserId: null,
    })
    expect(result).toEqual({ ok: true, userId: expect.any(Number) })

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'alice@example.com' },
    })
    expect(user.points).toBe(0)
    expect(user.referralCode).toMatch(/^[A-Za-z0-9_-]{10}$/)
    expect(await prisma.referral.count()).toBe(0)
    expect(await prisma.pointsTransaction.count()).toBe(0)
  })

  it('带有效邀请码注册：建立邀请关系、邀请人 +100 并写入流水', async () => {
    const { registerUser } = await import('@/lib/auth/service')

    const alice = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      currentUserId: null,
    })
    if (!alice.ok) throw new Error('setup failed')
    const { referralCode } = await prisma.user.findUniqueOrThrow({
      where: { id: alice.userId },
    })

    const bob = await registerUser({
      name: 'Bob',
      email: 'bob@example.com',
      refCode: referralCode,
      currentUserId: null,
    })
    expect(bob.ok).toBe(true)

    // 邀请人积分 +100；被邀请人 0（只奖邀请人）
    const referrer = await prisma.user.findUniqueOrThrow({
      where: { id: alice.userId },
    })
    expect(referrer.points).toBe(100)
    const referee = await prisma.user.findUniqueOrThrow({
      where: { email: 'bob@example.com' },
    })
    expect(referee.points).toBe(0)

    // 邀请关系正确关联
    const referral = await prisma.referral.findFirstOrThrow()
    expect(referral.referrerId).toBe(alice.userId)
    expect(referral.refereeId).toBe(referee.id)

    // 一条流水：100 分、referral_bonus、可追溯到邀请记录
    const tx = await prisma.pointsTransaction.findFirstOrThrow()
    expect(tx.userId).toBe(alice.userId)
    expect(tx.amount).toBe(100)
    expect(tx.reason).toBe('referral_bonus')
    expect(tx.referralId).toBe(referral.id)
  })

  it('无效邀请码：整体拒绝且零写入', async () => {
    const { registerUser } = await import('@/lib/auth/service')

    const result = await registerUser({
      name: 'Carol',
      email: 'carol@example.com',
      refCode: 'notexist0',
      currentUserId: null,
    })
    expect(result).toEqual({
      ok: false,
      code: 'INVALID_REFERRAL_CODE',
    })
    expect(await prisma.user.count()).toBe(0)
    expect(await prisma.pointsTransaction.count()).toBe(0)
  })

  it('自邀：整体拒绝且零写入（防 TOCTOU，校验在事务内）', async () => {
    const { registerUser } = await import('@/lib/auth/service')

    const alice = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      currentUserId: null,
    })
    if (!alice.ok) throw new Error('setup failed')
    const { referralCode } = await prisma.user.findUniqueOrThrow({
      where: { id: alice.userId },
    })

    const result = await registerUser({
      name: 'Alice2',
      email: 'alice2@example.com',
      refCode: referralCode,
      currentUserId: alice.userId,
    })
    expect(result).toEqual({
      ok: false,
      code: 'SELF_REFERRAL',
    })
    // 只有 setup 创建的 Alice，无新用户、无积分变动
    expect(await prisma.user.count()).toBe(1)
    expect(await prisma.pointsTransaction.count()).toBe(0)
  })
})
