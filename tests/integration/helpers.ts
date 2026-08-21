import { execSync } from 'node:child_process'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'

export type TestDatabase = {
  container: StartedPostgreSqlContainer
  url: string
}

/**
 * 启动一个一次性 PostgreSQL 容器，应用迁移，并把 DATABASE_URL 写入 process.env。
 *
 * 必须在 dynamic import 业务模块（如 @/lib/db）之前调用，因为 PrismaClient
 * 在模块加载时就会实例化 PrismaPg 并捕获当前的 connectionString。
 */
export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('exam_test')
    .withUsername('test')
    .withPassword('test')
    .start()

  const url = container.getConnectionUri()

  // 应用迁移到容器内的库（覆盖 prisma.config.ts 从 .env 加载的默认值）
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })

  process.env.DATABASE_URL = url

  return { container, url }
}

/**
 * 停止容器。仅在测试套件结束时调用（通常在 afterAll 里）。
 */
export async function stopTestDatabase(container: StartedPostgreSqlContainer): Promise<void> {
  await container.stop()
}
