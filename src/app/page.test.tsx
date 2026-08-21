import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from '@/app/page'

describe('Home page（落地页）', () => {
  it('渲染标题与引导文案', () => {
    render(<Home />)
    expect(
      screen.getByRole('heading', { name: '推荐返利系统' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/注册账号/)).toBeInTheDocument()
  })

  it('提供前往登录页的 CTA', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: '登录 / 注册' })
    expect(link).toHaveAttribute('href', '/login')
  })
})