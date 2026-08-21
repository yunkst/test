import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
const { getMock, setMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  deleteMock: vi.fn(),
}))
const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }))
const { createSessionMock, deleteSessionMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}))
const { registerUserMock } = vi.hoisted(() => ({ registerUserMock: vi.fn() }))
const { verifySessionMock } = vi.hoisted(() => ({ verifySessionMock: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getMock, set: setMock, delete: deleteMock })),
}))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))
vi.mock('@/lib/db', () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}))
vi.mock('./session', () => ({
  createSession: createSessionMock,
  deleteSession: deleteSessionMock,
}))
vi.mock('./service', () => ({ registerUser: registerUserMock }))
vi.mock('./dal', () => ({ verifySession: verifySessionMock }))

import { Prisma } from '@/generated/prisma/client'
import { loginOrRegister } from './actions'

function makeForm(name: string, email: string): FormData {
  const form = new FormData()
  form.set('name', name)
  form.set('email', email)
  return form
}

describe('loginOrRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 默认：查不到邮箱（走注册分支）；无会话；注册成功
    findUniqueMock.mockResolvedValue(null)
    verifySessionMock.mockResolvedValue(null)
    registerUserMock.mockResolvedValue({ ok: true, userId: 7 })
    getMock.mockReturnValue(undefined)
  })

  it('校验失败：返回字段错误，不触碰数据库', async () => {
    const state = await loginOrRegister(undefined, makeForm('', 'bad-email'))
    expect(state).toEqual({
      errors: { name: expect.any(Array), email: expect.any(Array) },
    })
    expect(findUniqueMock).not.toHaveBeenCalled()
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('邮箱已存在且用户名匹配：登录并跳转 dashboard', async () => {
    findUniqueMock.mockResolvedValue({
      id: 3,
      name: 'Alice',
      email: 'alice@x.com',
    })

    await expect(
      loginOrRegister(undefined, makeForm('Alice', 'alice@x.com')),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(createSessionMock).toHaveBeenCalledWith(3)
    expect(redirectMock).toHaveBeenCalledWith('/dashboard')
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it('邮箱已存在但用户名不匹配：报错且不登入', async () => {
    findUniqueMock.mockResolvedValue({
      id: 3,
      name: 'Alice',
      email: 'alice@x.com',
    })

    const state = await loginOrRegister(
      undefined,
      makeForm('alice2', 'alice@x.com'),
    )
    expect(state).toEqual({ message: '用户名与该邮箱注册时不一致' })
    expect(createSessionMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('新邮箱注册：读取 ref cookie → 建 session → 删除 cookie → 跳转', async () => {
    getMock.mockReturnValue({ value: 'REFCODE01' })

    await expect(
      loginOrRegister(undefined, makeForm('Bob', 'bob@x.com')),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(registerUserMock).toHaveBeenCalledWith({
      name: 'Bob',
      email: 'bob@x.com',
      refCode: 'REFCODE01',
      currentUserId: null,
    })
    expect(createSessionMock).toHaveBeenCalledWith(7)
    expect(deleteMock).toHaveBeenCalledWith('ref')
    expect(redirectMock).toHaveBeenCalledWith('/dashboard')
  })

  it('注册被拒（如邀请码无效）：返回 message，不建 session', async () => {
    registerUserMock.mockResolvedValue({
      ok: false,
      code: 'INVALID_REFERRAL_CODE',
      message: '邀请码无效',
    })

    const state = await loginOrRegister(undefined, makeForm('Bob', 'bob@x.com'))
    expect(state).toEqual({ message: '邀请码无效' })
    expect(createSessionMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('并发注册同邮箱（P2002）：返回兜底 message', async () => {
    registerUserMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    )

    const state = await loginOrRegister(undefined, makeForm('Bob', 'bob@x.com'))
    expect(state).toEqual({ message: '该邮箱刚被注册，请用对应用户名登录' })
  })
})