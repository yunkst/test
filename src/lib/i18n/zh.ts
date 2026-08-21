// 中文字典：多语言文案的唯一事实源。
// 字典为纯数据（可序列化），插值占位符 {key} 由 i18n 的 t() 助手替换——
// 保证整本字典可安全跨 server/client 边界传递（RSC payload）。
// en.ts 以 `Dictionary`（zh 形状放宽后的类型）锚定，新增键必须双语同步补齐。

/**
 * 把字面量类型放宽为宽类型：字符串字面量 → string，嵌套对象递归。
 * 使 `const en: Dictionary = {...}` 允许不同语言的文案值，同时保持键结构强约束。
 */
type Widen<T> = {
  [K in keyof T]: T[K] extends object ? Widen<T[K]> : string
}

export const zh = {
  meta: {
    title: '推荐返利系统',
    description: '注册账号，邀请好友得积分奖励',
  },
  home: {
    title: '推荐返利系统',
    subtitle:
      '注册账号，生成专属邀请链接。好友通过你的链接注册，你将立即获得积分奖励。',
    cta: '登录 / 注册',
  },
  login: {
    title: '登录 / 注册',
    heading: '欢迎',
    subtitle: '输入用户名和邮箱即可登录；邮箱未注册将自动创建账号。',
    nameLabel: '用户名',
    emailLabel: '邮箱',
    submit: '登录 / 注册',
    pending: '处理中…',
    helper: '无需密码，邮箱未注册时将自动创建账号。',
  },
  dashboard: {
    title: '我的面板',
    greeting: '你好，{name}',
    logout: '退出登录',
    pointsLabel: '积分余额',
    inviteTitle: '邀请好友',
    referralsTitle: '邀请记录',
    referralsEmpty: '还没有邀请记录，分享你的链接开始吧',
    pointsEarned: '+{amount} 积分',
    transactionsTitle: '积分流水',
    transactionsEmpty: '暂无积分记录',
    reasonLabels: {
      // 键与 DB 存储值一致（REASON_REFERRAL_BONUS）
      referral_bonus: '邀约奖励',
    },
  },
  referralCard: {
    copied: '已复制',
    copy: '复制链接',
    helper: '好友通过此链接注册账号，你将获得积分奖励。',
  },
  validation: {
    nameRequired: '请输入用户名',
    nameTooLong: '用户名不能超过 50 个字符',
    emailInvalid: '请输入有效的邮箱地址',
  },
  errors: {
    nameMismatch: '用户名与该邮箱注册时不一致',
    invalidReferralCode: '邀请码无效',
    selfReferral: '不能邀请自己',
    emailTaken: '该邮箱刚被注册，请用对应用户名登录',
  },
} as const

export type Dictionary = Widen<typeof zh>