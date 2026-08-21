import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { getMock, setMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  deleteMock: vi.fn(),
}))
const { sessionDeleteManyMock, sessionCreateMock } = vi.hoisted(() => ({
  sessionDeleteManyMock: vi.fn(),
  sessionCreateMock: vi.fn(),
}))
const { transactionMock } = vi.hoisted(() => ({ transactionMock: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: getMock,
    set: setMock,
    delete: deleteMock,
  })),
}))
vi.mock('@/lib/db', () => ({
  prisma: {
    session: {
      deleteMany: sessionDeleteManyMock,
      create: sessionCreateMock,
    },
    // Prisma $transaction 数组形式：按传入顺序执行各操作
    $transaction: transactionMock,
  },
}))

// 不 mock './constants'，真实 TTL 参与断言
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from './constants'
import { deleteSession, generateSessionToken, hashToken, createSession } from './session'

// 让 $transaction 真正执行传入的每个操作（与 Prisma 数组语义一致）
transactionMock.mockImplementation(async (ops: Promise<unknown>[]) => {
  await Promise.all(ops)
})

describe('generateSessionToken / hashToken', () => {
  it('token：32 字节 base64url，可安全放入 cookie（无冲突字符）', () => {
    expect(generateSessionToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('hash：sha256 hex 64 位、确定性、与原文不可逆', () => {
    const h1 = hashToken('token-abc')
    const h2 = hashToken('token-abc')
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
    expect(h1).toBe(h2)
    expect(h1).not.toBe('token-abc')
    expect(hashToken('token-其他')).not.toBe(h1)
  })
})

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('事务语义：先清过期 → 再吊销该用户全部旧会话 → 建新会话', async () => {
    await createSession(7)

    // deleteMany 第一次：清理全局过期会话
    expect(sessionDeleteManyMock).toHaveBeenNthCalledWith(1, {
      where: { expiresAt: { lte: expect.any(Date) } },
    })
    // deleteMany 第二次：吊销该用户旧会话（单会话模型的体现）
    expect(sessionDeleteManyMock).toHaveBeenNthCalledWith(2, {
      where: { userId: 7 },
    })

    const createArg = sessionCreateMock.mock.calls[0][0]
    // 落库的是 token 的 sha256，而非原文
    expect(createArg.data.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(createArg.data.userId).toBe(7)
    expect(createArg.data.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('写入 httpOnly / sameSite=lax cookie；dev 环境关闭 secure', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    try {
      await createSession(1)

      const [name, token, options] = setMock.mock.calls[0]
      expect(name).toBe(SESSION_COOKIE_NAME)
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/) // 原始 token 进 cookie
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // dev http 直连必须为 false
        path: '/',
      })
      // cookie 过期时间 = now + 30 天 TTL
      const expectedExpires = Date.now() + SESSION_TTL_MS
      expect(options.expires.getTime()).toBeGreaterThan(expectedExpires - 5_000)
      expect(options.expires.getTime()).toBeLessThanOrEqual(expectedExpires)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('production 环境开启 secure flag', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      await createSession(1)
      expect(setMock.mock.calls[0][2]).toMatchObject({ secure: true })
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('deleteSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('有 token：按哈希删除库行 + 清除 cookie（带值删除）', async () => {
    getMock.mockReturnValue({ value: 'current-token' })
    await deleteSession()

    expect(sessionDeleteManyMock).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('current-token') },
    })
    expect(deleteMock).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })

  it('无 token：跳过库查询，仍幂等清除 cookie', async () => {
    getMock.mockReturnValue(undefined)
    await deleteSession()

    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(deleteMock).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})