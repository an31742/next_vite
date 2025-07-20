import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// 获取当前时间
const getCurrentTime = () => {
  return new Date().toISOString().replace("T", " ").slice(0, 19)
}

export async function POST(request: Request) {
  try {
    console.log(`[${getCurrentTime()}] Received login request`)

    const body = await request.json()
    const { userName, passWord } = body

    console.log("Login attempt:", { userName, time: getCurrentTime() })

    if (userName === "admin" && passWord === "12345") {
      const token = jwt.sign(
        {
          userId: 1,
          userName,
          loginTime: getCurrentTime(),
          role: "admin",
        },
        "admin_secret_key_2025_07_20",
        { expiresIn: "24h" }
      )

      // 创建响应对象
      const response = NextResponse.json(
        {
          code: 200,
          message: "登录成功",
          data: {
            token,
            user: {
              userId: 1,
              userName,
              role: "admin",
              loginTime: getCurrentTime(),
            },
          },
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      )

      // 设置 cookie
      cookies().set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
      })

      return response
    }

    return NextResponse.json(
      {
        code: 401,
        message: "用户名或密码错误",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "服务器错误，请稍后重试",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    )
  }
}

// 处理预检请求
export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    }
  )
}
