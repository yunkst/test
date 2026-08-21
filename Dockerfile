# 开发环境镜像：只负责安装依赖，源码由 compose 以 bind mount 挂载
FROM node:22-alpine

WORKDIR /app

# 按 package.json 中 packageManager 字段声明的版本启用 pnpm
RUN corepack enable

# 只拷贝依赖清单，最大化利用 Docker 层缓存：
# 源码变更不会触发 pnpm install 重跑
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

EXPOSE 3000

# 启动前置（dev 容器每次启动必做，幂等）：
# 1) migrate deploy 应用迁移 —— compose 挂载了 prisma/migrations，
#    全新 postgres-data 卷下也能一键起（fix：空库 P2021）
# 2) generate 重新生成 client —— compose 的 .:/app bind mount 遮蔽了镜像层生成物，
#    生成结果写入挂载后的源码树 src/generated（.gitignore 已排除，不污染 git）
# 3) 监听 0.0.0.0，否则容器外无法访问 dev server
# 注：prisma.config.ts 的 env('DATABASE_URL') 在 generate 时求值，由 compose environment 注入
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm prisma generate && pnpm dev:docker"]
