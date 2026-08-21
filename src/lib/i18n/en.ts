// 英文字典：与 zh.ts 同构，类型锚定在中文源（Widen 形状）上，新增键缺失即编译报错。
import { type Dictionary } from './zh'

export const en: Dictionary = {
  meta: {
    title: 'Referral Points System',
    description: 'Sign up and earn points by inviting friends',
  },
  home: {
    title: 'Referral Points System',
    subtitle:
      'Create an account and generate your own invite link. When a friend signs up through your link, you instantly earn points.',
    cta: 'Log in / Sign up',
  },
  login: {
    title: 'Log in / Sign up',
    heading: 'Welcome',
    subtitle:
      'Enter your username and email to log in. If the email is not registered, an account will be created automatically.',
    nameLabel: 'Username',
    emailLabel: 'Email',
    submit: 'Log in / Sign up',
    pending: 'Processing…',
    helper: 'No password needed. A new account is created if the email is not registered.',
  },
  dashboard: {
    title: 'My Dashboard',
    greeting: 'Hello, {name}',
    logout: 'Log out',
    pointsLabel: 'Points Balance',
    inviteTitle: 'Invite Friends',
    referralsTitle: 'Referrals',
    referralsEmpty: 'No referrals yet — share your link to get started',
    pointsEarned: '+{amount} points',
    transactionsTitle: 'Points History',
    transactionsEmpty: 'No points transactions yet',
    reasonLabels: {
      // 键与 DB 存储值一致（REASON_REFERRAL_BONUS）
      referral_bonus: 'Referral bonus',
    },
  },
  referralCard: {
    copied: 'Copied',
    copy: 'Copy link',
    helper: 'When a friend signs up through this link, you earn points.',
  },
  validation: {
    nameRequired: 'Please enter a username',
    nameTooLong: 'Username must be 50 characters or fewer',
    emailInvalid: 'Please enter a valid email address',
  },
  errors: {
    nameMismatch: "The username doesn't match the one used to register this email",
    invalidReferralCode: 'Invalid referral code',
    selfReferral: 'You cannot invite yourself',
    emailTaken: 'This email was just registered. Please log in with the matching username.',
  },
}