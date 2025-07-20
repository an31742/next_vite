import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SECRET = "your_jwt_secret"

export async function POST(request: Request) {
  const { token } = await request.json()
  try {
    const decoded = jwt.verify(token, SECRET)
    // 生成新 token，保留原有 payload
    const { name, roles } = decoded as any
    const newToken = jwt.sign({ name, roles }, SECRET, { expiresIn: "2h" })
    return NextResponse.json({ code: 200, token: newToken, msg: "刷新成功" })
  } catch (e) {
    return NextResponse.json({ code: 401, msg: "无效token" }, { status: 401 })
  }
}
