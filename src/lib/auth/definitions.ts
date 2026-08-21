import { z } from 'zod'
import { zh } from '@/lib/i18n/zh'
import type { Dictionary } from '@/lib/i18n/zh'

// 登录/注册一表单校验 schema（无密码认证：用户名 + 邮箱）。
// 错误消息按语言字典生成：服务端 Action 根据表单 locale 字段调用工厂。
export function createAuthFormSchema(dict: Dictionary) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, dict.validation.nameRequired)
      .max(50, dict.validation.nameTooLong),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(dict.validation.emailInvalid)),
  })
}

// 默认语言（zh）schema：供默认路径与测试直接使用
export const AuthFormSchema = createAuthFormSchema(zh)

// useActionState 的 state 形态：
// - errors：字段级校验错误（zod fieldErrors 形状）
// - message：业务级错误（用户名不匹配 / 邀请码无效 / 自邀 / 并发注册）
export type AuthFormState =
  | {
      errors?: { name?: string[]; email?: string[] }
      message?: string
    }
  | undefined
