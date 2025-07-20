import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // 只处理 API 请求
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // 设置响应头
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    }

    // 处理 OPTIONS 请求
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers,
      })
    }

    // 继续处理其他请求
    const response = NextResponse.next()

    // 添加头部
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
