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

# 监听 0.0.0.0，否则容器外无法访问 dev server
CMD ["pnpm", "dev:docker"]
