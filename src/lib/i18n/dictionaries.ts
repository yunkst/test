// 字典聚合与获取。
// - getDictionary：页面/布局用，lang 来自路由 params，未受支持时 notFound()
// - getDictionaryForLocale：服务端 Action 用，locale 来自表单字段，宽松校验回退默认语言
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, hasLocale } from './locale'
import { en } from './en'
import { zh } from './zh'

export type { Locale } from './locale'
export type { Dictionary } from './zh'

const dictionaries = { zh, en } as const

export function getDictionary(lang: string) {
  if (!hasLocale(lang)) notFound()
  return dictionaries[lang]
}

export function getDictionaryForLocale(locale: unknown) {
  return hasLocale(locale) ? dictionaries[locale] : dictionaries[DEFAULT_LOCALE]
}
