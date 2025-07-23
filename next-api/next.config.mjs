/** @type {import('next').NextConfig} */
import path from "path"
import { fileURLToPath } from "url"

// 获取 __dirname 的 ESM 写法
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  // 禁用页面渲染
  pageExtensions: ["tsx", "ts", "jsx", "js"],

  // 配置头部
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://localhost:5173" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Content-Type", value: "application/json" },
        ],
      },
    ]
  },

  // 配置重写规则
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ]
  },

  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "app")
    return config
  },
}


import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(nextConfig, {
  // Sentry构建配置
  silent: true,
  org: "your-organization-slug",
  project: "your-project-slug",
}, {
  // 运行时配置
  dsn: "https://your-sentry-dsn.sentry.io/123",
  tracesSampleRate: 1.0,
  autoInstrumentServerFunctions: true,
  autoInstrumentAppDirectory: true,
}); 
