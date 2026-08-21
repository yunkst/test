import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loginOrRegisterMock } = vi.hoisted(() => ({ loginOrRegisterMock: vi.fn() }))

// stub 掉 actions 的服务端依赖链（jsdom 下不可直接运行）
vi.mock('@/lib/auth/actions', () => ({ loginOrRegister: loginOrRegisterMock }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}))
vi.mock('@/lib/db', () => ({ prisma: {} }))
vi.mock('server-only', () => ({}))

import { LoginForm } from './login-form'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loginOrRegisterMock.mockResolvedValue(undefined)
  })

  it('渲染用户名 / 邮箱输入框与提交按钮', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '登录 / 注册' }),
    ).toBeInTheDocument()
  })

  it('提交：action 收到包含输入值的 FormData', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('用户名'), 'Alice')
    await user.type(screen.getByLabelText('邮箱'), 'alice@x.com')
    await user.click(screen.getByRole('button', { name: '登录 / 注册' }))

    await waitFor(() => {
      expect(loginOrRegisterMock).toHaveBeenCalledTimes(1)
    })
    const [, formData] = loginOrRegisterMock.mock.calls[0]
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('name')).toBe('Alice')
    expect(formData.get('email')).toBe('alice@x.com')
  })

  it('业务错误（message）：以 alert 展示', async () => {
    loginOrRegisterMock.mockResolvedValue({ message: '邀请码无效' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('用户名'), 'Bob')
    await user.type(screen.getByLabelText('邮箱'), 'bob@x.com')
    await user.click(screen.getByRole('button', { name: '登录 / 注册' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('邀请码无效')
  })

  it('字段校验错误（errors.name）：输入框下方展示', async () => {
    loginOrRegisterMock.mockResolvedValue({
      errors: { name: ['请输入用户名'] },
    })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('邮箱'), 'bob@x.com')
    await user.click(screen.getByRole('button', { name: '登录 / 注册' }))

    expect(await screen.findByText('请输入用户名')).toBeInTheDocument()
  })
})