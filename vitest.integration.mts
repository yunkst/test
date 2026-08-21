import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // 集成测试跑在纯 Node 环境，无需 DOM
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'dist'],
    css: false,
    // 拉镜像 + 启动容器 + 迁移较慢，放宽超时
    testTimeout: 30_000,
    hookTimeout: 180_000,
    // 串行执行：避免并发起容器抢占 Docker 资源
    fileParallelism: false,
  },
})
