import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone：next build 产出独立运行的最小化 server.js + 依赖追踪产物，
  // 供 Dockerfile.prod 的 runner 阶段直接 node server.js
  output: "standalone",
};

export default nextConfig;
