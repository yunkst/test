import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferralLinkCard } from './referral-link-card'

const writeTextMock = vi.fn().mockResolvedValue(undefined)

describe('ReferralLinkCard', () => {
  beforeEach(() => {
    writeTextMock.mockClear()
    // 覆盖 globalThis.navigator，确保组件读取到 mock（与测试同 realm）
    vi.stubGlobal('navigator', {
      userAgent: 'vitest',
      clipboard: { writeText: writeTextMock },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('挂载后展示完整邀请短链', async () => {
    render(<ReferralLinkCard referralCode="ABC123" />)
    // origin 由 useEffect 补全（jsdom 默认 http://localhost:3000），等待异步渲染
    expect(
      await screen.findByText('http://localhost:3000/ref/ABC123'),
    ).toBeInTheDocument()
  })

  it('点击复制：写入剪贴板并切换为已复制', async () => {
    render(<ReferralLinkCard referralCode="ABC123" />)

    // 用 fireEvent（同步派发）而非 userEvent：userEvent 的异步链会触发
    // vi.stubGlobal 的还原，导致组件读到 jsdom 原生 clipboard
    fireEvent.click(await screen.findByRole('button', { name: '复制链接' }))

    expect(writeTextMock).toHaveBeenCalledWith(
      'http://localhost:3000/ref/ABC123',
    )
    expect(
      await screen.findByRole('button', { name: '已复制' }),
    ).toBeInTheDocument()
  })
})