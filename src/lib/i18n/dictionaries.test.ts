import { describe, expect, it, vi } from 'vitest'

// notFound 在路由层抛异常（控制流出口），测试中替换为抛错以断言未知语言
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

import { en } from './en'
import { zh } from './zh'
import { getDictionary, getDictionaryForLocale } from './dictionaries'

describe('getDictionary', () => {
  it('按语言返回对应字典', () => {
    expect(getDictionary('zh')).toBe(zh)
    expect(getDictionary('en')).toBe(en)
  })

  it('未知语言：触发 notFound（而非静默回退）', () => {
    expect(() => getDictionary('fr')).toThrow('NEXT_NOT_FOUND')
  })
})

describe('getDictionaryForLocale', () => {
  it('宽松校验：支持语言返回对应字典，否则回退默认（zh）', () => {
    expect(getDictionaryForLocale('en')).toBe(en)
    expect(getDictionaryForLocale('zh')).toBe(zh)
    expect(getDictionaryForLocale('fr')).toBe(zh)
    expect(getDictionaryForLocale(undefined)).toBe(zh)
    expect(getDictionaryForLocale(null)).toBe(zh)
    expect(getDictionaryForLocale('')).toBe(zh)
  })
})

describe('双语字典结构一致性', () => {
  it('en 与 zh 键完全同构（en 以 typeof zh 锚定，编译期已保证）', () => {
    const keysOf = (obj: object): string[] => Object.keys(obj).sort()
    expect(keysOf(en)).toEqual(keysOf(zh))
  })
})