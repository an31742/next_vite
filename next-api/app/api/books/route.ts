import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb+srv://an31742:212314@cluster0.2xk4dyf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const dbName = process.env.DB_NAME || "Cluster0"
const collectionName = "books"

async function getCollection() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  return { collection: db.collection(collectionName), client }
}

// GET: 获取所有书籍
export async function GET(req: NextRequest) {
  const { collection, client } = await getCollection()
  try {
    const books = await collection.find({}).toArray()
    return NextResponse.json(books)
  } finally {
    await client.close()
  }
}

// POST: 新增书籍
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { collection, client } = await getCollection()
  try {
    const result = await collection.insertOne(body)
    return NextResponse.json({ insertedId: result.insertedId })
  } finally {
    await client.close()
  }
}

// PATCH: 更新书籍（根据 _id）
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { _id, ...update } = body
  const { collection, client } = await getCollection()
  try {
    const result = await collection.updateOne({ _id: new ObjectId(_id) }, { $set: update })
    return NextResponse.json({ modifiedCount: result.modifiedCount })
  } finally {
    await client.close()
  }
}

// DELETE: 删除书籍（根据 _id）
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })
  const { collection, client } = await getCollection()
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ deletedCount: result.deletedCount })
  } finally {
    await client.close()
  }
}
