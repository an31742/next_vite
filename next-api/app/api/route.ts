import { NextResponse } from "next/server"

export async function GET() {
  // 可根据实际接口动态生成
  const apis = ["/api/login", "/api/userinfo", "/api/auth-buttons", "/api/refresh-token", "/api/routes", "/api/resource-tree"]
  return NextResponse.json({ code: 200, apis })
}
