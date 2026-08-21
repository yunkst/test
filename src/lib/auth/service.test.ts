import { beforeEach, describe, expect, it, vi } from 'vitest'

// jsdom 下真实 server-only 包会 throw，stub 为空
vi.mock('server-only', () => ({}))

// 事务 mock 必须在 vi.hoisted 内定义：vi.mock 工厂会被提升到文件顶部执行，
// 引用顶层 const 会触发 TDZ（Cannot access before initialization）
const mockTx = vi.hoisted(() => {
  const findUnique = vi.fn()
  const create = vi.fn()
  const update = vi.fn()
  const referralCreate = vi.fn()
  const pointsCreate = vi.fn()

  const fakeTx = {
    user: { findUnique, create, update },
    referral: { create: referralCreate },
    pointsTransaction: { create: pointsCreate },
  }
  const $transaction = vi.fn(
    async (fn: (tx: typeof fakeTx) => unknown) => fn(fakeTx),
  )

  return { findUnique, create, update, referralCreate, pointsCreate, $transaction }
})

vi.mock('@/lib/db', () => ({
  prisma: { $transaction: mockTx.$transaction },
}))

import { registerUser } from './service'

const { findUnique, create, update, referralCreate, pointsCreate } = mockTx

describe('registerUser（注册 + 发奖事务）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('无邀请码：仅创建账号，不建邀请关系/流水/积分', async () => {
    findUnique.mockResolvedValue(null) // 邀请码唯一性预检
    create.mockResolvedValue({ id: 1 })

    const result = await registerUser({
      name: 'Alice',
      email: 'alice@x.com',
      currentUserId: null,
    })

    expect(result).toEqual({ ok: true, userId: 1 })
    expect(create).toHaveBeenCalledTimes(1)
    const { referralCode, ...data } = create.mock.calls[0][0].data
    expect(data).toEqual({ name: 'Alice', email: 'alice@x.com' })
    expect(referralCode).toMatch(/^[A-Za-z0-9_-]{10}$/)
    expect(referralCreate).not.toHaveBeenCalled()
    expect(pointsCreate).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('带有效邀请码：创建用户 + 邀请关系 + 流水 + 邀请人积分 +100', async () => {
    findUnique
      .mockResolvedValueOnce({ id: 9 }) // 查邀请人
      .mockResolvedValueOnce(null) // 邀请码唯一性预检
    create.mockResolvedValue({ id: 2 })
    referralCreate.mockResolvedValue({ id: 5 })
    pointsCreate.mockResolvedValue({ id: 1 })
    update.mockResolvedValue({})

    const result = await registerUser({
      name: 'Bob',
      email: 'bob@x.com',
      refCode: 'REFCODE01',
      currentUserId: null,
    })

    expect(result).toEqual({ ok: true, userId: 2 })
    expect(findUnique).toHaveBeenCalledWith({
      where: { referralCode: 'REFCODE01' },
      select: { id: true },
    })
    expect(referralCreate).toHaveBeenCalledWith({
      data: { referrerId: 9, refereeId: 2 },
    })
    expect(pointsCreate).toHaveBeenCalledWith({
      data: { userId: 9, amount: 100, reason: 'referral_bonus', referralId: 5 },
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { points: { increment: 100 } },
    })
  })

  it('无效邀请码：返回失败且零写入', async () => {
    findUnique.mockResolvedValueOnce(null) // 查邀请人不存在

    const result = await registerUser({
      name: 'Carol',
      email: 'carol@x.com',
      refCode: 'NOPE',
      currentUserId: null,
    })

    expect(result).toEqual({
      ok: false,
      code: 'INVALID_REFERRAL_CODE',
      message: '邀请码无效',
    })
    expect(create).not.toHaveBeenCalled()
    expect(pointsCreate).not.toHaveBeenCalled()
  })

  it('自邀（currentUserId === 邀请人）：返回失败且零写入', async () => {
    findUnique.mockResolvedValueOnce({ id: 9 }) // 邀请人恰是当前登录用户

    const result = await registerUser({
      name: 'Alice2',
      email: 'alice2@x.com',
      refCode: 'REFCODE01',
      currentUserId: 9,
    })

    expect(result).toEqual({
      ok: false,
      code: 'SELF_REFERRAL',
      message: '不能邀请自己',
    })
    expect(create).not.toHaveBeenCalled()
    expect(pointsCreate).not.toHaveBeenCalled()
  })
})