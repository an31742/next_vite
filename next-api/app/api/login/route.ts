import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getCurrentDateTime } from "../../../utils/auth"
export const dynamic = "force-dynamic" // 强制动态路由
export const runtime = "nodejs" // 指定 Node.js 运行时

// 定义当前时间和用户
const CURRENT_TIME = getCurrentDateTime()
const CURRENT_USER = "admin"
const JWT_SECRET = "admin_secret"

export async function POST(request: Request) {
  // 设置响应头
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  }

  try {
    // 解析请求体
    const body = await request.json()
    console.log("Received request body:", body)

    const { name, password } = body

    // 验证用户名和密码
    if (name === CURRENT_USER && password === "12345") {
      const token = jwt.sign(
        {
          userId: 1,
          name,
          loginTime: CURRENT_TIME,
          role: ["admin", "user", "super-management"],
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      )

      // 返回成功响应
      return new NextResponse(
        JSON.stringify({
          code: 200,
          message: "登录成功",
          data: {
            token,
            user: {
              userId: 1,
              name,
              role: ["admin", "user", "super-management"],
              loginTime: CURRENT_TIME,
            },
          },
        }),
        {
          status: 200,
          headers,
        }
      )
    }

    // 返回失败响应
    return new NextResponse(
      JSON.stringify({
        code: 401,
        message: "用户名或密码错误",
      }),
      {
        status: 401,
        headers,
      }
    )
  } catch (error) {
    console.error("Login error:", error)

    // 返回错误响应
    return new NextResponse(
      JSON.stringify({
        code: 500,
        message: "服务器错误",
        error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      }),
      {
        status: 500,
        headers,
      }
    )
  }
}

// 处理 OPTIONS 请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  })
}
