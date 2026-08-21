import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

const props = (lang: string) => ({
  params: Promise.resolve({ lang }),
  searchParams: Promise.resolve({}),
})

describe('Home page（落地页）', () => {
  it('渲染标题与引导文案', async () => {
    render(await Home(props('zh')))
    expect(
      screen.getByRole('heading', { name: '推荐返利系统' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/注册账号/)).toBeInTheDocument()
  })

  it('提供前往登录页的 CTA', async () => {
    render(await Home(props('zh')))
    const link = screen.getByRole('link', { name: '登录 / 注册' })
    expect(link).toHaveAttribute('href', '/zh/login')
  })

  it('英文语言：渲染英文文案且 CTA 指向 /en/login', async () => {
    render(await Home(props('en')))
    expect(
      screen.getByRole('heading', { name: 'Referral Points System' }),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Log in / Sign up' })
    expect(link).toHaveAttribute('href', '/en/login')
  })
})