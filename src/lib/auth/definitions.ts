import { z } from 'zod'

// 登录/注册一表单校验 schema（无密码认证：用户名 + 邮箱）
// email 先归一化（trim + 小写）再校验格式，作为唯一标识
export const AuthFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请输入用户名')
    .max(50, '用户名不能超过 50 个字符'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('请输入有效的邮箱地址')),
})

// useActionState 的 state 形态：
// - errors：字段级校验错误（zod fieldErrors 形状）
// - message：业务级错误（用户名不匹配 / 邀请码无效 / 自邀 / 并发注册）
export type AuthFormState =
  | {
      errors?: { name?: string[]; email?: string[] }
      message?: string
    }
  | undefined
