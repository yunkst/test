import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PrismaClient } from '@/generated/prisma/client'
import { startTestDatabase, stopTestDatabase, type TestDatabase } from './helpers'

let db: TestDatabase
let prisma: PrismaClient

beforeAll(async () => {
  db = await startTestDatabase()
  // 必须动态 import：PrismaClient 在模块加载时就捕获了 DATABASE_URL
  // 在 env 就绪后才加载 db 模块，才能拿到容器连接串
  ;({ prisma } = await import('@/lib/db'))
}, 180_000)

afterAll(async () => {
  await stopTestDatabase(db.container)
})

describe('User model against real PostgreSQL', () => {
  it('creates and reads a user', async () => {
    const created = await prisma.user.create({
      data: { email: 'crud@example.com', name: 'CRUD Test', referralCode: 'crud0001' },
    })
    expect(created.id).toBeGreaterThan(0)
    expect(created.createdAt).toBeInstanceOf(Date)
    expect(created.points).toBe(0)

    const fetched = await prisma.user.findUnique({
      where: { email: 'crud@example.com' },
    })
    expect(fetched?.name).toBe('CRUD Test')
  })

  it('enforces @unique on email at the database level', async () => {
    await prisma.user.create({
      data: { email: 'uniq@example.com', name: 'U1', referralCode: 'uniq0001' },
    })
    await expect(
      prisma.user.create({
        data: { email: 'uniq@example.com', name: 'U2', referralCode: 'uniq0002' },
      }),
    ).rejects.toThrow(/unique constraint/i)
  })

  it('enforces @unique on referralCode at the database level', async () => {
    await prisma.user.create({
      data: { email: 'code1@example.com', name: 'C1', referralCode: 'samecode' },
    })
    await expect(
      prisma.user.create({
        data: { email: 'code2@example.com', name: 'C2', referralCode: 'samecode' },
      }),
    ).rejects.toThrow(/unique constraint/i)
  })

  it('@updatedAt advances when the row is updated', async () => {
    const original = await prisma.user.create({
      data: { email: 'ts@example.com', name: 'TS', referralCode: 'ts000001' },
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    const updated = await prisma.user.update({
      where: { id: original.id },
      data: { name: 'Renamed' },
    })
    expect(updated.name).toBe('Renamed')
    expect(updated.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime())
  })
})
