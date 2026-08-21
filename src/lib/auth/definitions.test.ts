import { describe, expect, it } from 'vitest'
import { zh } from '@/lib/i18n/zh'
import { createAuthFormSchema } from './definitions'

describe('AuthFormSchema', () => {
  const AuthFormSchema = createAuthFormSchema(zh)
  it('合法输入通过，且 email/name 被归一化', () => {
    const result = AuthFormSchema.safeParse({
      name: '  Alice  ',
      email: '  Alice@Example.COM ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Alice')
      expect(result.data.email).toBe('alice@example.com')
    }
  })

  it('拒绝空用户名', () => {
    const result = AuthFormSchema.safeParse({ name: '   ', email: 'a@x.com' })
    expect(result.success).toBe(false)
  })

  it('拒绝超过 50 字符的用户名', () => {
    const result = AuthFormSchema.safeParse({ name: 'a'.repeat(51), email: 'a@x.com' })
    expect(result.success).toBe(false)
  })

  it('拒绝非法邮箱', () => {
    const result = AuthFormSchema.safeParse({ name: 'A', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})