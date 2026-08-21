import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { getDashboardDataMock } = vi.hoisted(() => ({
  getDashboardDataMock: vi.fn(),
}))
vi.mock('@/lib/auth/dal', () => ({ getDashboardData: getDashboardDataMock }))
vi.mock('@/lib/auth/actions', () => ({ logout: vi.fn() }))

import DashboardPage from './page'

const props = (lang: string) => ({
  params: Promise.resolve({ lang }),
  searchParams: Promise.resolve({}),
})

const baseUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@x.com',
  referralCode: 'ABC123',
  points: 0,
}

describe('Dashboard page', () => {
  it('空态：积分 0、无邀请记录与流水', async () => {
    getDashboardDataMock.mockResolvedValue({
      user: baseUser,
      referrals: [],
      transactions: [],
    })

    render(await DashboardPage(props('zh')))

    expect(screen.getByRole('heading', { name: '你好，Alice' })).toBeInTheDocument()
    expect(screen.getByLabelText('积分余额')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/还没有邀请记录/)).toBeInTheDocument()
    expect(screen.getByText('暂无积分记录')).toBeInTheDocument()
    expect(screen.getByText(/退出登录/)).toBeInTheDocument()
  })

  it('数据态：积分 100、邀请记录含被邀请人、流水含邀约奖励', async () => {
    getDashboardDataMock.mockResolvedValue({
      user: { ...baseUser, points: 100 },
      referrals: [
        {
          id: 1,
          refereeName: 'Bob',
          refereeEmail: 'bob@x.com',
          createdAt: new Date('2026-08-20T10:00:00Z'),
        },
      ],
      transactions: [
        {
          id: 1,
          amount: 100,
          reason: 'referral_bonus',
          createdAt: new Date('2026-08-20T10:00:00Z'),
        },
      ],
    })

    render(await DashboardPage(props('zh')))

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('bob@x.com')).toBeInTheDocument()
    expect(screen.getByText('+100 积分')).toBeInTheDocument()
    expect(screen.getByText('邀约奖励')).toBeInTheDocument()
    // 邀请链接卡片展示 /ref/ 短链
    expect(screen.getByText(/\/ref\/ABC123/)).toBeInTheDocument()
  })

  it('英文语言：渲染英文面板文案与奖励标签', async () => {
    getDashboardDataMock.mockResolvedValue({
      user: { ...baseUser, points: 100 },
      referrals: [{ id: 1, refereeName: 'Bob', refereeEmail: 'bob@x.com', createdAt: new Date() }],
      transactions: [{ id: 1, amount: 100, reason: 'referral_bonus', createdAt: new Date() }],
    })

    render(await DashboardPage(props('en')))

    expect(screen.getByRole('heading', { name: 'Hello, Alice' })).toBeInTheDocument()
    expect(screen.getByText('+100 points')).toBeInTheDocument()
    expect(screen.getByText('Referral bonus')).toBeInTheDocument()
  })
})