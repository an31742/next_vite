import { NextResponse } from "next/server"

export async function GET() {
  // 可根据实际角色返回不同按钮权限
  return NextResponse.json({
    code: 200,
    data: {
      admin: ["add", "edit", "delete", "export"],
      user: ["add", "export"],
    },
    msg: "成功",
  })
}
