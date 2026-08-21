import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from './constants'

// 生成会话 token：32 字节 base64url（仅原始 token 进入 httpOnly cookie）
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

// 数据库只存 token 的 sha256 哈希，泄露库表也无法伪造 cookie
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// 创建会话：写 Session 表 + 设置 httpOnly cookie。
// cookie 只能在 Server Action 或 Route Handler 中设置。
export async function createSession(userId: number): Promise<void> {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    // dev 环境为 http 直连，必须关闭 secure，否则浏览器不保存 cookie
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

// 删除会话：清理 Session 表行 + 清除 cookie（幂等）
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    })
  }
  cookieStore.delete(SESSION_COOKIE_NAME)
}
