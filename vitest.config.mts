import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite 原生解析 tsconfig.json 中的 paths（@/* -> ./src/*）
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // 与 Next.js 构建产物目录解耦，避免重复编译
    exclude: ['node_modules', '.next', 'dist'],
    // 测试不依赖 CSS，避免 Tailwind 4 的 PostCSS 处理阻塞
    css: false,
  },
})
