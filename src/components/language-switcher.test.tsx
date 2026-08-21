import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher, switchPathname } from './language-switcher'

const { usePathnameMock, pushMock, refreshMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

describe('switchPathname', () => {
  it('替换语言前缀，其余路径保持不变', () => {
    expect(switchPathname('/en/login', 'en', 'zh')).toBe('/zh/login')
    expect(switchPathname('/zh/dashboard', 'zh', 'en')).toBe('/en/dashboard')
    expect(switchPathname('/en', 'en', 'zh')).toBe('/zh')
  })

  it('当前路径前缀与 from 不符时，按完整路径补前缀', () => {
    // 异常场景：理论上 usePathname 一定带前缀，但保持幂等
    expect(switchPathname('/zh/login', 'en', 'zh')).toBe('/zh/zh/login')
    expect(switchPathname('/login', 'en', 'zh')).toBe('/zh/login')
  })

  it('根路径前缀往返', () => {
    expect(switchPathname('/zh', 'zh', 'en')).toBe('/en')
    expect(switchPathname('/en', 'en', 'zh')).toBe('/zh')
  })
})

describe('LanguageSwitcher（组件交互）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 模拟真实浏览器：上一次测试写入的 cookie 不跨用例残留
    document.cookie = `${'NEXT_LOCALE'}=; path=/; max-age=0`
  })

  it('中文页面展示 EN 按钮；点击写 cookie 并跳转英文路径', () => {
    usePathnameMock.mockReturnValue('/zh/login')

    render(<LanguageSwitcher />)
    const btn = screen.getByRole('button', { name: 'EN' })

    fireEvent.click(btn)
    expect(document.cookie).toContain('NEXT_LOCALE=en')
    expect(pushMock).toHaveBeenCalledWith('/en/login')
    expect(refreshMock).toHaveBeenCalled()
  })

  it('英文页面展示"中文"按钮；点击切回中文路径', () => {
    usePathnameMock.mockReturnValue('/en/dashboard')

    render(<LanguageSwitcher />)
    const btn = screen.getByRole('button', { name: '中文' })

    fireEvent.click(btn)
    expect(document.cookie).toContain('NEXT_LOCALE=zh')
    expect(pushMock).toHaveBeenCalledWith('/zh/dashboard')
  })

  it('路径无语言前缀（RSC 导航中间态）时：以 NEXT_LOCALE cookie 兜底判断当前语言', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    document.cookie = 'NEXT_LOCALE=en; path=/'

    render(<LanguageSwitcher />)
    // 当前语言为 en → 展示"中文"按钮，而不是误判为 zh
    expect(screen.getByRole('button', { name: '中文' })).toBeInTheDocument()
  })
})