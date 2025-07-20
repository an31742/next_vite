import { NextResponse } from "next/server"
import { getDb } from "../_db"

export async function POST() {
  const db = await getDb()
  // 插入用户
  await db.collection("users").deleteMany({})
  await db.collection("users").insertMany([
    { name: "admin", password: "12345", roles: ["admin"] },
    { name: "user", password: "12345", roles: ["user"] },
  ])
  // 插入组织
  await db.collection("orgs").deleteMany({})
  await db.collection("orgs").insertMany([
    { type: "技术部", name: "技术部", id: 2 },
    { type: "产品部", name: "产品部", id: 3 },
    { type: "运营部", name: "运营部", id: 4 },
  ])
  return NextResponse.json({ code: 200, msg: "初始化数据成功" })
}
