// 认证 / 会话 / 邀请 / 积分相关常量
// 注意：本文件不 import 'server-only'，src/proxy.ts（中间件层）也需引用

export const SESSION_COOKIE_NAME = 'session'
// 邀请码 cookie：仅 /ref/[code] 路由写入，注册成功后删除（一次性引用）
export const REFERRAL_COOKIE_NAME = 'ref'

// 会话有效期：30 天
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
// 邀请码 cookie 有效期：7 天（秒，用于 cookie maxAge）
export const REFERRAL_COOKIE_TTL_S = 7 * 24 * 60 * 60

// 每次有效邀请奖励邀请人的积分
export const REFERRAL_BONUS_POINTS = 100
// 积分流水类型（邀约奖励）
export const REASON_REFERRAL_BONUS = 'referral_bonus'
