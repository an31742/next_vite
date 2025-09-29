import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getCollection } from "../../../utils/db"
import { User, COLLECTIONS } from "../../../types/accounting"

export const dynamic = "force-dynamic" // 强制动态路由
export const runtime = "nodejs" // 指定 Node.js 运行时

const JWT_SECRET = process.env.JWT_SECRET || "accounting_app_secret_2024"

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
    console.log("Received login request:", body)

    const { name, password } = body

    // 验证管理员用户名和密码
    if (name === "admin" && password === "12345") {
      // 获取用户集合以统计小程序用户
      const usersCollection = await getCollection<User>(COLLECTIONS.USERS)
      const totalUsers = await usersCollection.countDocuments()

      const token = jwt.sign(
        {
          userId: "admin_1",
          name,
          role: ["admin", "super-management"],
          isAdmin: true,
          totalUsers
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
              userId: "admin_1",
              name,
              role: ["admin", "super-management"],
              isAdmin: true,
              totalUsers
            },
          },
        }),
        {
          status: 200,
          headers,
        }
      )
    }

    // 验证普通用户登录
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS)
    const user = await usersCollection.findOne({
      $or: [
        { nickname: name },
        { openid: name }
      ]
    })

    if (user && password === "12345") {  // 简单密码验证
      const token = jwt.sign(
        {
          userId: user.id,
          openid: user.openid,
          name: user.nickname || name,
          role: ["user"],
          isAdmin: false
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
              userId: user.id,
              name: user.nickname || name,
              role: ["user"],
              isAdmin: false
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
