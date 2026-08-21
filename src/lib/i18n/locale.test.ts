import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  detectLocale,
  getLocaleFromPath,
  hasLocale,
  localeTags,
} from './locale'

describe('hasLocale', () => {
  it('仅认可 zh / en', () => {
    expect(hasLocale('zh')).toBe(true)
    expect(hasLocale('en')).toBe(true)
    expect(hasLocale('fr')).toBe(false)
    expect(hasLocale('ZH')).toBe(false)
    expect(hasLocale(undefined)).toBe(false)
    expect(hasLocale('')).toBe(false)
  })
})

describe('getLocaleFromPath', () => {
  it('解析带语言前缀的路径，rest 保留其余部分', () => {
    expect(getLocaleFromPath('/en/login')).toEqual({ locale: 'en', rest: '/login' })
    expect(getLocaleFromPath('/zh/dashboard')).toEqual({
      locale: 'zh',
      rest: '/dashboard',
    })
    expect(getLocaleFromPath('/en')).toEqual({ locale: 'en', rest: '/' })
    expect(getLocaleFromPath('/zh')).toEqual({ locale: 'zh', rest: '/' })
  })

  it('无前缀或前缀不受支持返回 null', () => {
    expect(getLocaleFromPath('/login')).toBeNull()
    expect(getLocaleFromPath('/')).toBeNull()
    expect(getLocaleFromPath('/fr/login')).toBeNull()
    // 前缀必须是完整段：/en-extra 不是语言前缀
    expect(getLocaleFromPath('/en-extra/page')).toBeNull()
  })
})

describe('detectLocale', () => {
  it('cookie 优先于 Accept-Language', () => {
    expect(
      detectLocale({ cookie: 'en', acceptLanguage: 'zh-CN,zh;q=0.9' }),
    ).toBe('en')
  })

  it('无 cookie：按 Accept-Language 权重选择', () => {
    expect(detectLocale({ acceptLanguage: 'en-US,en;q=0.9,zh;q=0.8' })).toBe('en')
    expect(detectLocale({ acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8' })).toBe('zh')
    // q 值同权时取靠前者
    expect(detectLocale({ acceptLanguage: 'zh;q=0.9,en;q=0.9' })).toBe('zh')
    expect(detectLocale({ acceptLanguage: 'en;q=0.7,zh;q=0.9' })).toBe('zh')
  })

  it('接受语言区/地区后缀（zh-Hant 归为 zh）与不受支持语言', () => {
    expect(detectLocale({ acceptLanguage: 'de-DE,de;q=0.9,en;q=0.5' })).toBe('en')
    expect(detectLocale({ acceptLanguage: 'ja-JP' })).toBe('zh')
    expect(detectLocale({})).toBe(DEFAULT_LOCALE)
    expect(detectLocale({ acceptLanguage: undefined, cookie: undefined })).toBe('zh')
  })
})

describe('localeTags', () => {
  it('zh → zh-CN、en → en-US（供 Intl 使用）', () => {
    expect(localeTags).toEqual({ zh: 'zh-CN', en: 'en-US' })
  })
})