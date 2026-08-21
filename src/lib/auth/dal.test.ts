import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// React.cache 在非 React 渲染上下文可能跨用例缓存结果，
// 此处替换为 passthrough 以保证每个用例都真实执行函数体
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, cache: (fn: (...args: unknown[]) => unknown) => fn }
})

const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }))
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))
const { sessionFindUniqueMock, userFindUniqueMock } = vi.hoisted(() => ({
  sessionFindUniqueMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getMock })),
}))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))
vi.mock('@/lib/db', () => ({
  prisma: {
    session: { findUnique: sessionFindUniqueMock },
    user: { findUnique: userFindUniqueMock },
  },
}))

// 注意：不 mock './session'——经真实 hashToken 才能验证 token → hash 查询路径
import { getCurrentUser, requireUser, verifySession } from './dal'

describe('verifySession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionFindUniqueMock.mockReset()
  })

  it('无 cookie：返回 null', async () => {
    getMock.mockReturnValue(undefined)
    await expect(verifySession()).resolves.toBeNull()
    expect(sessionFindUniqueMock).not.toHaveBeenCalled()
  })

  it('有效且未过期：返回 userId', async () => {
    getMock.mockReturnValue({ value: 'sometoken' })
    sessionFindUniqueMock.mockResolvedValue({
      userId: 5,
      expiresAt: new Date(Date.now() + 60_000),
    })

    await expect(verifySession()).resolves.toEqual({ userId: 5 })
    // 查询参数是 token 的 sha256，而非原文
    const arg = sessionFindUniqueMock.mock.calls[0][0]
    expect(arg.where.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(arg.where.tokenHash).not.toBe('sometoken')
  })

  it('已过期：返回 null', async () => {
    getMock.mockReturnValue({ value: 'stale-token' })
    sessionFindUniqueMock.mockResolvedValue({
      userId: 5,
      expiresAt: new Date(Date.now() - 60_000),
    })

    await expect(verifySession()).resolves.toBeNull()
  })
})

describe('getCurrentUser / requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCurrentUser：返回 DTO 白名单字段', async () => {
    getMock.mockReturnValue({ value: 'token' })
    sessionFindUniqueMock.mockResolvedValue({
      userId: 5,
      expiresAt: new Date(Date.now() + 60_000),
    })
    userFindUniqueMock.mockResolvedValue({
      id: 5,
      name: 'Alice',
      email: 'alice@x.com',
      referralCode: 'CODE',
      points: 100,
    })

    await expect(getCurrentUser()).resolves.toEqual({
      id: 5,
      name: 'Alice',
      email: 'alice@x.com',
      referralCode: 'CODE',
      points: 100,
    })
  })

  it('getCurrentUser：无会话返回 null', async () => {
    getMock.mockReturnValue(undefined)
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('requireUser：未登录触发 redirect', async () => {
    getMock.mockReturnValue(undefined)
    await requireUser()
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })
})