# 开发环境镜像：只负责安装依赖，源码由 compose 以 bind mount 挂载
FROM node:22-alpine

WORKDIR /app

# 按 package.json 中 packageManager 字段声明的版本启用 pnpm
RUN corepack enable

# 只拷贝依赖清单，最大化利用 Docker 层缓存：
# 源码变更不会触发 pnpm install 重跑
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Prisma 7 必需：在生成 client 之前把 schema 与 prisma.config.ts 拷贝进来
# 运行时 bind mount 会覆盖它们，但生成结果落在 node_modules 命名卷里持久存在
COPY prisma ./prisma
COPY prisma.config.ts ./
# generate 只读 schema 不连库，但 prisma.config.ts 的 env() 求值要求变量存在；
# 真实连接串在运行时由 compose environment 注入
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" pnpm prisma generate

EXPOSE 3000

# 监听 0.0.0.0，否则容器外无法访问 dev server
CMD ["pnpm", "dev:docker"]
