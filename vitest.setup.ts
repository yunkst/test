import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 每个用例结束后自动卸载 React 树，避免节点泄漏影响下一个用例
afterEach(() => {
  cleanup()
})
