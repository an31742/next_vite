import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SECRET = "your_jwt_secret"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.replace("Bearer ", "")
  try {
    const decoded = jwt.verify(token, SECRET)
    return NextResponse.json({ code: 200, data: decoded })
  } catch (e) {
    return NextResponse.json({ code: 401, msg: "无效token" }, { status: 401 })
  }
}
