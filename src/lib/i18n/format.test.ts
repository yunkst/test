import { describe, expect, it } from 'vitest'
import { t } from './format'

describe('t（占位符插值）', () => {
  it('替换 {key} 占位符', () => {
    expect(t('你好，{name}', { name: 'Alice' })).toBe('你好，Alice')
    expect(t('+{amount} 积分', { amount: 100 })).toBe('+100 积分')
  })

  it('支持数字与多值', () => {
    expect(t('{a}-{b}-{c}', { a: 1, b: 'x', c: 3.5 })).toBe('1-x-3.5')
  })

  it('缺失变量替换为空串；无占位符原样返回', () => {
    expect(t('{name}', {})).toBe('')
    expect(t('纯文本', { name: 'Alice' })).toBe('纯文本')
  })
})