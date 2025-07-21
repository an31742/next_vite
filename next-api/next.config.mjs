/** @type {import('next').NextConfig} */
import path from "path"

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

export default nextConfig
