import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDb } from "../_db"

const SECRET = "your_jwt_secret"

export async function POST(request: Request) {
  const { name, password } = await request.json()
  const db = await getDb()
  // 保证 password 为字符串类型
  const user = await db.collection("users").findOne({ name, password: String(password) })
  if (!user) {
    return NextResponse.json({ code: 401, msg: "用户名或密码错误" }, { status: 401 })
  }
  const roles = user.roles || []
  const token = jwt.sign({ name, roles }, SECRET, { expiresIn: "2h" })
  return NextResponse.json({ code: 200, token, roles, msg: "登录成功" })
}
