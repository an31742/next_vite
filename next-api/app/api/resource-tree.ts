import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDb } from "./_db"

const SECRET = "your_jwt_secret"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.replace("Bearer ", "")
  try {
    const decoded = jwt.verify(token, SECRET) as { roles?: string[] }
    const roles = decoded.roles || []
    const db = await getDb()
    let tree: any[] = []
    if (roles.includes("admin")) {
      tree = await db.collection("orgs").find().toArray()
    } else if (roles.includes("user")) {
      tree = await db
        .collection("orgs")
        .find({ type: { $in: ["技术部", "产品部"] } })
        .toArray()
    }
    return NextResponse.json({ code: 200, data: tree })
  } catch (e) {
    return NextResponse.json({ code: 401, msg: "无效token" }, { status: 401 })
  }
}
