import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
const { setMock } = vi.hoisted(() => ({ setMock: vi.fn() }))
const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }))

vi.mock('next/navigation', () => ({ redirect: redirectMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: setMock })),
}))
vi.mock('@/lib/db', () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}))
vi.mock('@/lib/auth/constants', () => ({
  REFERRAL_COOKIE_NAME: 'ref',
  REFERRAL_COOKIE_TTL_S: 604800,
}))

import { GET } from './route'

describe('GET /ref/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('邀请码存在：写入 ref cookie 并跳转登录页', async () => {
    findUniqueMock.mockResolvedValue({ id: 9 })

    await expect(
      GET(new Request('http://localhost/ref/ABC123'), {
        params: Promise.resolve({ code: 'ABC123' }),
      }),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { referralCode: 'ABC123' },
      select: { id: true },
    })
    expect(setMock).toHaveBeenCalledWith(
      'ref',
      'ABC123',
      expect.objectContaining({ maxAge: 604800, httpOnly: true, path: '/' }),
    )
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('无效邀请码：不写 cookie，仍跳转登录页', async () => {
    findUniqueMock.mockResolvedValue(null)

    await expect(
      GET(new Request('http://localhost/ref/BADCODE'), {
        params: Promise.resolve({ code: 'BADCODE' }),
      }),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(setMock).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })
})